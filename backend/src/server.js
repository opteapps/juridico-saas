import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import swagger from '@fastify/swagger'
import swaggerUI from '@fastify/swagger-ui'
import websocket from '@fastify/websocket'
import rateLimit from '@fastify/rate-limit'
import multipart from '@fastify/multipart'
import { prisma } from './database/prisma.js'
import { redis } from './database/redis.js'
import { authRoutes } from './modules/auth/routes.js'
import { tenantRoutes } from './modules/tenants/routes.js'
import { usuarioRoutes } from './modules/usuarios/routes.js'
import { clienteRoutes } from './modules/clientes/routes.js'
import { processoRoutes } from './modules/processos/routes.js'
import { movimentacaoRoutes } from './modules/movimentacoes/routes.js'
import { agendaRoutes } from './modules/agenda/routes.js'
import { documentoRoutes } from './modules/documentos/routes.js'
import { financeiroRoutes } from './modules/financeiro/routes.js'
import { diligenciaRoutes } from './modules/diligencias/routes.js'
import { notificacaoRoutes } from './modules/notificacoes/routes.js'
import { iaRoutes } from './modules/ia/routes.js'
import { juriRoutes } from './modules/jurimetria/routes.js'
import { superAdminRoutes } from './modules/superadmin/routes.js'
import { wsHandler } from './modules/notificacoes/websocket.js'
import { startJobs } from './jobs/index.js'
import { errorHandler } from './middlewares/errorHandler.js'

const app = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'warn' : 'info',
  },
})

// Plugins
await app.register(cors, {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
})

await app.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
})

await app.register(jwt, {
  secret: process.env.JWT_SECRET,
})

await app.register(multipart, {
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
})

await app.register(websocket)

await app.register(swagger, {
  openapi: {
    info: { title: 'Jurídico SaaS API', version: '1.0.0' },
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
  },
})

await app.register(swaggerUI, { routePrefix: '/docs' })

// WebSocket
await app.register(async (instance) => {
  instance.get('/ws', { websocket: true }, wsHandler)
})

// Routes
const apiPrefix = '/api/v1'
await app.register(authRoutes, { prefix: `${apiPrefix}/auth` })
await app.register(tenantRoutes, { prefix: `${apiPrefix}/tenants` })
await app.register(usuarioRoutes, { prefix: `${apiPrefix}/usuarios` })
await app.register(clienteRoutes, { prefix: `${apiPrefix}/clientes` })
await app.register(processoRoutes, { prefix: `${apiPrefix}/processos` })
await app.register(movimentacaoRoutes, { prefix: `${apiPrefix}/movimentacoes` })
await app.register(agendaRoutes, { prefix: `${apiPrefix}/agenda` })
await app.register(documentoRoutes, { prefix: `${apiPrefix}/documentos` })
await app.register(financeiroRoutes, { prefix: `${apiPrefix}/financeiro` })
await app.register(diligenciaRoutes, { prefix: `${apiPrefix}/diligencias` })
await app.register(notificacaoRoutes, { prefix: `${apiPrefix}/notificacoes` })
await app.register(iaRoutes, { prefix: `${apiPrefix}/ia` })
await app.register(juriRoutes, { prefix: `${apiPrefix}/jurimetria` })
await app.register(superAdminRoutes, { prefix: `${apiPrefix}/super-admin` })

// Health check
app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }))

// Seed endpoint — protegido por secret, uso único
app.post('/setup/seed', async (request, reply) => {
  const secret = request.headers['x-setup-secret']
  if (secret !== (process.env.SETUP_SECRET || 'juridico-setup-2024')) {
    return reply.status(403).send({ error: 'Acesso negado' })
  }
  try {
    const { seedDatabase } = await import('./database/seeds/index.js')
    await seedDatabase()
    return { ok: true, message: 'Seed executado com sucesso' }
  } catch (err) {
    return reply.status(500).send({ error: err.message })
  }
})

// Error handler
app.setErrorHandler(errorHandler)

// Seed automático na primeira execução
async function seedSeNecessario() {
  try {
    const totalPlanos = await prisma.plano.count()
    if (totalPlanos === 0) {
      app.log.info('Banco vazio — executando seed inicial...')
      const { seedDatabase } = await import('./database/seeds/index.js')
      await seedDatabase()
      app.log.info('Seed concluído com sucesso')
    }
  } catch (err) {
    app.log.warn('Seed automático falhou (pode já ter sido executado):', err.message)
  }
}

// Start
const start = async () => {
  try {
    await prisma.$connect()
    app.log.info('Banco de dados conectado')

    await seedSeNecessario()

    try {
      await startJobs()
      app.log.info('Jobs iniciados')
    } catch (err) {
      app.log.warn('Jobs não iniciados (Redis indisponível):', err.message)
    }

    const port = Number(process.env.PORT) || 3001
    await app.listen({ port, host: '0.0.0.0' })
    app.log.info(`Servidor rodando na porta ${port}`)
    app.log.info(`Documentação API: http://localhost:${port}/docs`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
