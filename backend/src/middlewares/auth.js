import { prisma } from '../database/prisma.js'

export async function authenticate(request, reply) {
  try {
    await request.jwtVerify()
    const { userId, tenantId, role } = request.user
    
    const usuario = await prisma.usuario.findFirst({
      where: { id: userId, ativo: true },
      select: { id: true, tenantId: true, role: true, nome: true, email: true, areasAtuacao: true },
    })
    
    if (!usuario) {
      return reply.status(401).send({ error: 'Usuário não encontrado ou inativo' })
    }
    
    request.usuario = usuario
  } catch (err) {
    reply.status(401).send({ error: 'Token inválido ou expirado' })
  }
}

export function authorize(...roles) {
  return async (request, reply) => {
    if (!roles.includes(request.usuario?.role)) {
      return reply.status(403).send({ error: 'Acesso negado' })
    }
  }
}

export function tenantMiddleware(request, reply, done) {
  if (request.usuario && !request.usuario.tenantId && request.usuario.role !== 'super_admin') {
    return reply.status(403).send({ error: 'Tenant não encontrado' })
  }
  done()
}

export function blockSuperAdmin(request, reply, done) {
  if (request.usuario?.role === 'super_admin') {
    return reply.status(403).send({ 
      error: 'Acesso negado', 
      message: 'Super Admin não tem acesso a módulos dos escritórios' 
    })
  }
  done()
}
