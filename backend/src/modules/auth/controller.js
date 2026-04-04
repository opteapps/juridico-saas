import bcrypt from 'bcryptjs'
import { authService } from '../../services/authService.js'
import { auditService } from '../../services/auditService.js'
import { prisma } from '../../database/prisma.js'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(6),
  deviceInfo: z.object({
    name: z.string().optional(),
    type: z.string().optional(),
  }).optional(),
})

const twoFactorSchema = z.object({
  userId: z.string().uuid(),
  code: z.string().length(6),
  deviceInfo: z.object({
    name: z.string().optional(),
    type: z.string().optional(),
  }).optional(),
})

const registerSchema = z.object({
  nome: z.string().min(2),
  email: z.string().email(),
  senha: z.string().min(8),
  nomeEscritorio: z.string().min(2),
  cnpj: z.string().optional(),
  planoId: z.string().uuid().optional(),
})

export const authController = {
  /**
   * Login com email/senha
   * Suporta 2FA e verificação de dispositivo
   */
  async login(request, reply) {
    try {
      const { email, senha, deviceInfo } = loginSchema.parse(request.body)
      const ipAddress = request.ip
      const userAgent = request.headers['user-agent']

      console.log('Login attempt:', { email, ip: ipAddress })

      const result = await authService.login(email, senha, deviceInfo, ipAddress, userAgent)

      console.log('Login result:', { success: result.success, requiresTwoFactor: result.requiresTwoFactor })

      // Se precisa de 2FA ou verificação de dispositivo
      if (result.requiresTwoFactor || result.requiresDeviceVerification) {
        return reply.send(result)
      }

      // Assina o token JWT
      const accessToken = request.server.jwt.sign(
        { 
          userId: result.user.id, 
          tenantId: result.user.tenantId, 
          role: result.user.role 
        },
        { expiresIn: '15m' }
      )

      return reply.send({
        success: true,
        accessToken,
        refreshToken: result.tokens.refreshToken,
        expiresIn: result.tokens.expiresIn,
        usuario: result.user,
      })
    } catch (error) {
      console.error('Login error:', error)
      return reply.status(401).send({ error: error.message || 'Credenciais inválidas' })
    }
  },

  /**
   * Verifica código 2FA
   */
  async verifyTwoFactor(request, reply) {
    try {
      const { userId, code, deviceInfo } = twoFactorSchema.parse(request.body)
      const ipAddress = request.ip
      const userAgent = request.headers['user-agent']

      const result = await authService.verifyTwoFactor(userId, code, deviceInfo, ipAddress, userAgent)

      // Assina o token JWT
      const accessToken = request.server.jwt.sign(
        { 
          userId: result.user.id, 
          tenantId: result.user.tenantId, 
          role: result.user.role 
        },
        { expiresIn: '15m' }
      )

      return reply.send({
        success: true,
        accessToken,
        refreshToken: result.tokens.refreshToken,
        expiresIn: result.tokens.expiresIn,
        usuario: result.user,
      })
    } catch (error) {
      return reply.status(401).send({ error: error.message })
    }
  },

  /**
   * Configura 2FA
   */
  async setupTwoFactor(request, reply) {
    try {
      const userId = request.usuario.id
      const setup = await authService.setupTwoFactor(userId)
      return reply.send(setup)
    } catch (error) {
      return reply.status(500).send({ error: error.message })
    }
  },

  /**
   * Confirma ativação do 2FA
   */
  async confirmTwoFactor(request, reply) {
    try {
      const userId = request.usuario.id
      const { code } = request.body
      
      const result = await authService.confirmTwoFactor(userId, code)
      return reply.send(result)
    } catch (error) {
      return reply.status(400).send({ error: error.message })
    }
  },

  /**
   * Desativa 2FA
   */
  async disableTwoFactor(request, reply) {
    try {
      const userId = request.usuario.id
      const { password } = request.body
      
      const result = await authService.disableTwoFactor(userId, password)
      return reply.send(result)
    } catch (error) {
      return reply.status(400).send({ error: error.message })
    }
  },

  /**
   * Verifica dispositivo
   */
  async verifyDevice(request, reply) {
    try {
      const { userId, token } = request.body
      const result = await authService.verifyDevice(userId, token)
      return reply.send(result)
    } catch (error) {
      return reply.status(400).send({ error: error.message })
    }
  },

  /**
   * Lista dispositivos do usuário
   */
  async listDevices(request, reply) {
    try {
      const userId = request.usuario.id
      const devices = await authService.listDevices(userId)
      return reply.send({ devices })
    } catch (error) {
      return reply.status(500).send({ error: error.message })
    }
  },

  /**
   * Revoga dispositivo
   */
  async revokeDevice(request, reply) {
    try {
      const userId = request.usuario.id
      const { deviceId } = request.params
      
      const result = await authService.revokeDevice(userId, deviceId)
      return reply.send(result)
    } catch (error) {
      return reply.status(400).send({ error: error.message })
    }
  },

  /**
   * Logout de todos os dispositivos
   */
  async logoutAllDevices(request, reply) {
    try {
      const userId = request.usuario.id
      const result = await authService.logoutAllDevices(userId)
      return reply.send(result)
    } catch (error) {
      return reply.status(500).send({ error: error.message })
    }
  },

  /**
   * Registro de novo escritório
   */
  async register(request, reply) {
    try {
      const data = registerSchema.parse(request.body)
      
      // Verifica se email já existe
      const existente = await prisma.usuario.findFirst({
        where: { email: data.email.toLowerCase(), tenantId: null },
      })
      
      if (existente) {
        return reply.status(409).send({ error: 'Email já cadastrado' })
      }
      
      // Busca plano
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
            emailVerificado: false,
          },
        })
        
        await tx.assinatura.create({
          data: { tenantId: tenant.id, planoId: plano.id },
        })
        
        return { tenant, usuario }
      })
      
      await auditService.log(result.usuario.id, 'REGISTER', 'Tenant', result.tenant.id, {
        tenantId: result.tenant.id,
      })
      
      return reply.status(201).send({
        message: 'Escritório criado com sucesso',
        tenantId: result.tenant.id,
        usuarioId: result.usuario.id,
      })
    } catch (error) {
      console.error('Register error:', error)
      return reply.status(400).send({ error: error.message })
    }
  },

  /**
   * Refresh token
   */
  async refresh(request, reply) {
    try {
      const { refreshToken } = request.body
      
      if (!refreshToken) {
        return reply.status(400).send({ error: 'Refresh token obrigatório' })
      }
      
      const result = await authService.refreshTokens(refreshToken)
      
      const accessToken = request.server.jwt.sign(
        { 
          userId: result.user.id, 
          tenantId: result.user.tenantId, 
          role: result.user.role 
        },
        { expiresIn: '15m' }
      )
      
      return reply.send({ 
        accessToken, 
        refreshToken: result.tokens.refreshToken,
        usuario: result.user,
      })
    } catch (error) {
      return reply.status(401).send({ error: error.message })
    }
  },

  /**
   * Logout
   */
  async logout(request, reply) {
    const { refreshToken } = request.body
    
    if (refreshToken) {
      await prisma.sessao.deleteMany({ where: { refreshToken } })
    }
    
    await auditService.log(request.usuario?.id, 'LOGOUT', 'Usuario', request.usuario?.id, {
      tenantId: request.usuario?.tenantId,
    })
    
    return reply.send({ message: 'Logout realizado' })
  },

  /**
   * Dados do usuário logado
   */
  async me(request, reply) {
    const usuario = await prisma.usuario.findUnique({
      where: { id: request.usuario.id },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        oab: true,
        telefone: true,
        avatarUrl: true,
        areasAtuacao: true,
        tenantId: true,
        twoFactorEnabled: true,
        ultimoLogin: true,
        cargo: true,
        tenant: { 
          select: { 
            id: true, 
            nome: true, 
            logoUrl: true, 
            plano: true 
          } 
        },
      },
    })
    
    return reply.send(usuario)
  },

  /**
   * Recuperação de senha
   */
  async forgotPassword(request, reply) {
    const { email } = request.body
    
    // TODO: Implementar envio de email
    // Por segurança, sempre retorna sucesso mesmo se email não existir
    
    await auditService.log(null, 'FORGOT_PASSWORD_REQUEST', 'Usuario', null, {
      email: auditService.maskEmail(email),
    })
    
    return reply.send({ 
      message: 'Se o email existir, você receberá as instruções de recuperação' 
    })
  },

  /**
   * Reset de senha
   */
  async resetPassword(request, reply) {
    // TODO: Implementar com token de reset
    return reply.send({ message: 'Senha alterada com sucesso' })
  },

  /**
   * WebAuthn - início de registro
   */
  async webauthnRegister(request, reply) {
    // TODO: Implementar WebAuthn
    return reply.send({ message: 'WebAuthn registration initiated' })
  },

  /**
   * WebAuthn - autenticação
   */
  async webauthnAuthenticate(request, reply) {
    // TODO: Implementar WebAuthn
    return reply.send({ message: 'WebAuthn authentication' })
  },
}
