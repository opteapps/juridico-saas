import { prisma } from '../database/prisma.js'
import { hasPermission, ROLES } from '../config/permissions.js'

/**
 * Middleware de autenticação JWT
 */
export async function authenticate(request, reply) {
  try {
    await request.jwtVerify()
    const { userId, tenantId, role } = request.user
    
    const usuario = await prisma.usuario.findFirst({
      where: { id: userId, ativo: true },
      select: { 
        id: true, 
        tenantId: true, 
        role: true, 
        nome: true, 
        email: true, 
        areasAtuacao: true,
        permissoes: true,
        bloqueadoAte: true,
      },
    })
    
    if (!usuario) {
      return reply.status(401).send({ error: 'Usuário não encontrado ou inativo' })
    }

    // Verifica se está bloqueado
    if (usuario.bloqueadoAte && usuario.bloqueadoAte > new Date()) {
      return reply.status(401).send({ 
        error: 'Conta temporariamente bloqueada',
        bloqueadoAte: usuario.bloqueadoAte,
      })
    }
    
    request.usuario = usuario
  } catch (err) {
    reply.status(401).send({ error: 'Token inválido ou expirado' })
  }
}

/**
 * Middleware de autorização por roles
 */
export function authorize(...roles) {
  return async (request, reply) => {
    if (!roles.includes(request.usuario?.role)) {
      return reply.status(403).send({ error: 'Acesso negado' })
    }
  }
}

/**
 * Middleware de autorização por permissão
 */
export function requirePermission(permission) {
  return async (request, reply) => {
    const { role, permissoes } = request.usuario
    
    if (!hasPermission(role, permission, permissoes)) {
      return reply.status(403).send({ 
        error: 'Acesso negado',
        permission,
      })
    }
  }
}

/**
 * Middleware de verificação de tenant
 */
export function tenantMiddleware(request, reply, done) {
  if (request.usuario && !request.usuario.tenantId && request.usuario.role !== ROLES.SUPER_ADMIN) {
    return reply.status(403).send({ error: 'Tenant não encontrado' })
  }
  done()
}

/**
 * Bloqueia acesso de super admin a módulos dos escritórios
 */
export function blockSuperAdmin(request, reply, done) {
  if (request.usuario?.role === ROLES.SUPER_ADMIN) {
    return reply.status(403).send({ 
      error: 'Acesso negado', 
      message: 'Super Admin não tem acesso a módulos dos escritórios' 
    })
  }
  done()
}

/**
 * Verifica se usuário pode acessar recurso de outro usuário
 */
export function canAccessUser(targetUserIdParam = 'id') {
  return async (request, reply) => {
    const targetUserId = request.params[targetUserIdParam]
    const { id: currentUserId, role, tenantId } = request.usuario
    
    // Próprio usuário
    if (targetUserId === currentUserId) return
    
    // Super admin
    if (role === ROLES.SUPER_ADMIN) return
    
    // Admin do escritório
    if (role === ROLES.ADMIN_ESCRITORIO) {
      const targetUser = await prisma.usuario.findFirst({
        where: { id: targetUserId, tenantId },
      })
      if (!targetUser) {
        return reply.status(404).send({ error: 'Usuário não encontrado' })
      }
      return
    }
    
    return reply.status(403).send({ error: 'Acesso negado' })
  }
}

/**
 * Verifica rate limit por usuário
 */
export function rateLimitByUser(maxRequests = 100, windowMs = 60000) {
  const requests = new Map()
  
  return async (request, reply) => {
    const userId = request.usuario?.id || request.ip
    const now = Date.now()
    
    if (!requests.has(userId)) {
      requests.set(userId, [])
    }
    
    const userRequests = requests.get(userId)
    
    // Remove requisições antigas
    const validRequests = userRequests.filter(time => now - time < windowMs)
    
    if (validRequests.length >= maxRequests) {
      return reply.status(429).send({ 
        error: 'Muitas requisições',
        retryAfter: Math.ceil((validRequests[0] + windowMs - now) / 1000),
      })
    }
    
    validRequests.push(now)
    requests.set(userId, validRequests)
  }
}
