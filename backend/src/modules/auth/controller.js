import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { prisma } from '../../database/prisma.js'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(6),
  tenantId: z.string().uuid().optional(),
})

const registerSchema = z.object({
  nome: z.string().min(2),
  email: z.string().email(),
  senha: z.string().min(8),
  nomeEscritorio: z.string().min(2),
  cnpj: z.string().optional(),
  planoId: z.string().uuid().optional(),
})

function parseArrayFields(obj) {
  if (!obj) return obj
  const result = { ...obj }
  if (typeof result.areasAtuacao === 'string') result.areasAtuacao = JSON.parse(result.areasAtuacao || '[]')
  if (typeof result.areas === 'string') result.areas = JSON.parse(result.areas || '[]')
  if (typeof result.tags === 'string') result.tags = JSON.parse(result.tags || '[]')
  return result
}

export const authController = {
  async login(request, reply) {
    const { email, senha, tenantId } = loginSchema.parse(request.body)
    
    const usuario = await prisma.usuario.findFirst({
      where: {
        email: email.toLowerCase(),
        ativo: true,
        ...(tenantId ? { tenantId } : {}),
      },
      include: { tenant: { select: { id: true, nome: true, ativo: true } } },
    })
    
    if (!usuario) {
      return reply.status(401).send({ error: 'Credenciais inválidas' })
    }
    
    if (usuario.tenant && !usuario.tenant.ativo) {
      return reply.status(403).send({ error: 'Escritório suspenso. Entre em contato com o suporte.' })
    }
    
    const senhaValida = await bcrypt.compare(senha, usuario.senha)
    if (!senhaValida) {
      return reply.status(401).send({ error: 'Credenciais inválidas' })
    }
    
    const accessToken = request.server.jwt.sign(
      { userId: usuario.id, tenantId: usuario.tenantId, role: usuario.role },
      { expiresIn: '15m' }
    )
    
    const refreshToken = uuidv4()
    await prisma.sessao.create({
      data: {
        usuarioId: usuario.id,
        refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    })
    
    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId: usuario.tenantId,
        usuarioId: usuario.id,
        acao: 'LOGIN',
        entidade: 'Usuario',
        entidadeId: usuario.id,
        ip: request.ip,
      },
    })
    
    return {
      accessToken,
      refreshToken,
      usuario: parseArrayFields({
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role,
        tenantId: usuario.tenantId,
        tenant: usuario.tenant,
        areasAtuacao: usuario.areasAtuacao,
        avatarUrl: usuario.avatarUrl,
      }),
    }
  },

  async register(request, reply) {
    const data = registerSchema.parse(request.body)
    
    // Check if email already exists
    const existente = await prisma.usuario.findFirst({
      where: { email: data.email.toLowerCase(), tenantId: null },
    })
    if (existente) {
      return reply.status(409).send({ error: 'Email já cadastrado' })
    }
    
    // Get default plan
    const plano = data.planoId
      ? await prisma.plano.findUnique({ where: { id: data.planoId } })
      : await prisma.plano.findFirst({ where: { ativo: true }, orderBy: { preco: 'asc' } })
    
    if (!plano) {
      return reply.status(400).send({ error: 'Plano não encontrado' })
    }
    
    const senha = await bcrypt.hash(data.senha, 12)
    
    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          nome: data.nomeEscritorio,
          cnpj: data.cnpj,
          email: data.email.toLowerCase(),
          planoId: plano.id,
        },
      })
      
      const usuario = await tx.usuario.create({
        data: {
          tenantId: tenant.id,
          nome: data.nome,
          email: data.email.toLowerCase(),
          senha,
          role: 'admin_escritorio',
        },
      })
      
      await tx.assinatura.create({
        data: { tenantId: tenant.id, planoId: plano.id },
      })
      
      return { tenant, usuario }
    })
    
    return reply.status(201).send({
      message: 'Escritório criado com sucesso',
      tenantId: result.tenant.id,
      usuarioId: result.usuario.id,
    })
  },

  async refresh(request, reply) {
    const { refreshToken } = request.body
    if (!refreshToken) return reply.status(400).send({ error: 'Refresh token obrigatório' })
    
    const sessao = await prisma.sessao.findUnique({
      where: { refreshToken },
      include: { usuario: true },
    })
    
    if (!sessao || sessao.expiresAt < new Date()) {
      return reply.status(401).send({ error: 'Refresh token inválido ou expirado' })
    }
    
    const accessToken = request.server.jwt.sign(
      { userId: sessao.usuario.id, tenantId: sessao.usuario.tenantId, role: sessao.usuario.role },
      { expiresIn: '15m' }
    )
    
    return { accessToken }
  },

  async logout(request, reply) {
    const { refreshToken } = request.body
    if (refreshToken) {
      await prisma.sessao.deleteMany({ where: { refreshToken } })
    }
    return { message: 'Logout realizado' }
  },

  async me(request, reply) {
    const usuario = await prisma.usuario.findUnique({
      where: { id: request.usuario.id },
      select: {
        id: true, nome: true, email: true, role: true, oab: true,
        telefone: true, avatarUrl: true, areasAtuacao: true, tenantId: true,
        tenant: { select: { id: true, nome: true, logoUrl: true, plano: true } },
      },
    })
    return parseArrayFields(usuario)
  },

  async forgotPassword(request, reply) {
    // TODO: implement email sending
    return { message: 'Se o email existir, você receberá as instruções de recuperação' }
  },

  async resetPassword(request, reply) {
    return { message: 'Senha alterada com sucesso' }
  },

  async webauthnRegister(request, reply) {
    return { message: 'WebAuthn registration initiated' }
  },

  async webauthnAuthenticate(request, reply) {
    return { message: 'WebAuthn authentication' }
  },
}
