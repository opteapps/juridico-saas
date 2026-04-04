import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import speakeasy from 'speakeasy'
import QRCode from 'qrcode'
import { prisma } from '../database/prisma.js'
import { auditService } from './auditService.js'

/**
 * Serviço de Autenticação Premium
 * Gerencia login, 2FA, biometria e controle de dispositivos
 */
export const authService = {
  /**
   * Autentica usuário com email e senha
   * Retorna tokens se sucesso, ou informação sobre 2FA se necessário
   */
  async login(email, senha, deviceInfo, ipAddress, userAgent) {
    // Busca usuário
    const usuario = await prisma.usuario.findFirst({
      where: { email: email.toLowerCase() },
      include: { tenant: true, dispositivos: true },
    })

    if (!usuario) {
      await auditService.log(null, 'LOGIN_FAILED', 'Usuario', null, { email, reason: 'user_not_found', ip: ipAddress })
      throw new Error('Credenciais inválidas')
    }

    // Verifica se está bloqueado
    if (usuario.bloqueadoAte && usuario.bloqueadoAte > new Date()) {
      await auditService.log(usuario.id, 'LOGIN_BLOCKED', 'Usuario', usuario.id, { ip: ipAddress })
      throw new Error(`Conta bloqueada. Tente novamente após ${usuario.bloqueadoAte.toLocaleString('pt-BR')}`)
    }

    // Verifica se está ativo
    if (!usuario.ativo) {
      await auditService.log(usuario.id, 'LOGIN_FAILED', 'Usuario', usuario.id, { reason: 'inactive_account', ip: ipAddress })
      throw new Error('Conta desativada. Entre em contato com o administrador.')
    }

    // Verifica senha
    const senhaValida = await bcrypt.compare(senha, usuario.senha)
    
    if (!senhaValida) {
      // Incrementa tentativas falhas
      await prisma.usuario.update({
        where: { id: usuario.id },
        data: {
          tentativasFalhas: { increment: 1 },
          bloqueadoAte: usuario.tentativasFalhas + 1 >= 5 
            ? new Date(Date.now() + 30 * 60 * 1000) // Bloqueia por 30 min
            : null,
        },
      })

      await auditService.log(usuario.id, 'LOGIN_FAILED', 'Usuario', usuario.id, { 
        reason: 'invalid_password', 
        attempts: usuario.tentativasFalhas + 1,
        ip: ipAddress,
      })

      throw new Error('Credenciais inválidas')
    }

    // Reseta tentativas falhas
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { 
        tentativasFalhas: 0,
        bloqueadoAte: null,
      },
    })

    // Verifica se precisa de 2FA
    if (usuario.twoFactorEnabled) {
      return {
        requiresTwoFactor: true,
        userId: usuario.id,
        message: 'Código de verificação necessário',
      }
    }

    // Verifica dispositivo
    const deviceValid = await this.validateDevice(usuario.id, deviceInfo, userAgent)
    
    if (!deviceValid.trusted) {
      return {
        requiresDeviceVerification: true,
        userId: usuario.id,
        deviceToken: deviceValid.token,
        message: 'Novo dispositivo detectado. Verificação necessária.',
      }
    }

    // Gera tokens
    const tokens = await this.generateTokens(usuario, deviceInfo, ipAddress, userAgent)

    // Atualiza último login
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        ultimoLogin: new Date(),
        ultimoIp: ipAddress,
      },
    })

    // Atualiza dispositivo
    await this.updateDeviceAccess(usuario.id, deviceInfo, userAgent, ipAddress)

    await auditService.log(usuario.id, 'LOGIN_SUCCESS', 'Usuario', usuario.id, { ip: ipAddress, device: deviceInfo })

    return {
      success: true,
      user: this.sanitizeUser(usuario),
      tokens,
    }
  },

  /**
   * Verifica código 2FA
   */
  async verifyTwoFactor(userId, code, deviceInfo, ipAddress, userAgent) {
    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
      include: { tenant: true },
    })

    if (!usuario || !usuario.twoFactorEnabled) {
      throw new Error('2FA não habilitado')
    }

    const verified = speakeasy.totp.verify({
      secret: usuario.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 2, // Tolerância de 2 períodos (±1 minuto)
    })

    if (!verified) {
      await auditService.log(userId, '2FA_FAILED', 'Usuario', userId, { ip: ipAddress })
      throw new Error('Código inválido')
    }

    // Gera tokens
    const tokens = await this.generateTokens(usuario, deviceInfo, ipAddress, userAgent)

    // Atualiza último login
    await prisma.usuario.update({
      where: { id: userId },
      data: {
        ultimoLogin: new Date(),
        ultimoIp: ipAddress,
        tentativasFalhas: 0,
      },
    })

    await auditService.log(userId, 'LOGIN_SUCCESS_2FA', 'Usuario', userId, { ip: ipAddress })

    return {
      success: true,
      user: this.sanitizeUser(usuario),
      tokens,
    }
  },

  /**
   * Configura 2FA para usuário
   */
  async setupTwoFactor(userId) {
    const secret = speakeasy.generateSecret({
      name: `JuridicoSaaS:${userId}`,
      length: 32,
    })

    // Gera QR Code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url)

    // Salva secret temporariamente (só ativa após confirmação)
    await prisma.usuario.update({
      where: { id: userId },
      data: { twoFactorSecret: secret.base32 },
    })

    return {
      secret: secret.base32,
      qrCode: qrCodeUrl,
      manualEntryKey: secret.base32,
    }
  },

  /**
   * Confirma ativação do 2FA
   */
  async confirmTwoFactor(userId, code) {
    const usuario = await prisma.usuario.findUnique({ where: { id: userId } })

    if (!usuario?.twoFactorSecret) {
      throw new Error('2FA não iniciado')
    }

    const verified = speakeasy.totp.verify({
      secret: usuario.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 2,
    })

    if (!verified) {
      throw new Error('Código inválido')
    }

    await prisma.usuario.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    })

    await auditService.log(userId, '2FA_ENABLED', 'Usuario', userId, {})

    return { success: true, message: '2FA ativado com sucesso' }
  },

  /**
   * Desativa 2FA
   */
  async disableTwoFactor(userId, password) {
    const usuario = await prisma.usuario.findUnique({ where: { id: userId } })

    const senhaValida = await bcrypt.compare(password, usuario.senha)
    if (!senhaValida) {
      throw new Error('Senha incorreta')
    }

    await prisma.usuario.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    })

    await auditService.log(userId, '2FA_DISABLED', 'Usuario', userId, {})

    return { success: true, message: '2FA desativado' }
  },

  /**
   * Valida dispositivo
   */
  async validateDevice(userId, deviceInfo, userAgent) {
    if (!deviceInfo) return { trusted: true }

    const fingerprint = this.generateDeviceFingerprint(deviceInfo, userAgent)

    const dispositivo = await prisma.dispositivo.findFirst({
      where: {
        usuarioId: userId,
        fingerprint,
        ativo: true,
      },
    })

    if (dispositivo?.confiavel) {
      return { trusted: true, deviceId: dispositivo.id }
    }

    // Gera token para verificação
    const token = uuidv4()

    // Cria ou atualiza dispositivo
    await prisma.dispositivo.upsert({
      where: { fingerprint },
      update: { nome: deviceInfo.name || 'Dispositivo Desconhecido' },
      create: {
        usuarioId: userId,
        nome: deviceInfo.name || 'Dispositivo Desconhecido',
        tipo: deviceInfo.type || 'unknown',
        fingerprint,
        userAgent,
        confiavel: false,
      },
    })

    return { trusted: false, token }
  },

  /**
   * Verifica dispositivo via email/link
   */
  async verifyDevice(userId, token) {
    // Aqui implementaria verificação via token enviado por email
    // Por simplicidade, apenas marca como confiável
    
    const dispositivo = await prisma.dispositivo.findFirst({
      where: { usuarioId: userId },
      orderBy: { criadoEm: 'desc' },
    })

    if (!dispositivo) {
      throw new Error('Dispositivo não encontrado')
    }

    await prisma.dispositivo.update({
      where: { id: dispositivo.id },
      data: { confiavel: true },
    })

    await auditService.log(userId, 'DEVICE_TRUSTED', 'Dispositivo', dispositivo.id, {})

    return { success: true }
  },

  /**
   * Lista dispositivos do usuário
   */
  async listDevices(userId) {
    return prisma.dispositivo.findMany({
      where: { usuarioId: userId },
      orderBy: { ultimoAcesso: 'desc' },
    })
  },

  /**
   * Revoga dispositivo
   */
  async revokeDevice(userId, deviceId) {
    const dispositivo = await prisma.dispositivo.findFirst({
      where: { id: deviceId, usuarioId: userId },
    })

    if (!dispositivo) {
      throw new Error('Dispositivo não encontrado')
    }

    await prisma.dispositivo.update({
      where: { id: deviceId },
      data: { ativo: false, confiavel: false },
    })

    // Revoga sessões do dispositivo
    await prisma.sessao.deleteMany({
      where: {
        usuarioId: userId,
        deviceInfo: { contains: dispositivo.fingerprint },
      },
    })

    await auditService.log(userId, 'DEVICE_REVOKED', 'Dispositivo', deviceId, {})

    return { success: true }
  },

  /**
   * Logout remoto de todos os dispositivos
   */
  async logoutAllDevices(userId, exceptCurrent = false) {
    const where = { usuarioId: userId }
    
    if (exceptCurrent) {
      // Manter sessão atual (implementação depende do contexto)
    }

    await prisma.sessao.deleteMany({ where })

    // Revoga todos os dispositivos
    await prisma.dispositivo.updateMany({
      where: { usuarioId: userId },
      data: { confiavel: false },
    })

    await auditService.log(userId, 'LOGOUT_ALL_DEVICES', 'Usuario', userId, {})

    return { success: true }
  },

  /**
   * Gera tokens JWT
   */
  async generateTokens(usuario, deviceInfo, ipAddress, userAgent) {
    const accessToken = await this.signToken({
      userId: usuario.id,
      tenantId: usuario.tenantId,
      role: usuario.role,
      type: 'access',
    }, '15m')

    const refreshToken = uuidv4()

    await prisma.sessao.create({
      data: {
        usuarioId: usuario.id,
        refreshToken,
        deviceInfo: deviceInfo?.name || 'Unknown',
        ipAddress,
        userAgent,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
      },
    })

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutos
    }
  },

  /**
   * Assina token JWT
   */
  async signToken(payload, expiresIn) {
    // Implementação depende do Fastify JWT
    // Retorna payload para ser assinado pelo controller
    return { payload, expiresIn }
  },

  /**
   * Atualiza tokens
   */
  async refreshTokens(refreshToken) {
    const sessao = await prisma.sessao.findUnique({
      where: { refreshToken },
      include: { usuario: { include: { tenant: true } } },
    })

    if (!sessao || sessao.revokedAt || sessao.expiresAt < new Date()) {
      throw new Error('Sessão inválida')
    }

    // Gera novos tokens
    const tokens = await this.generateTokens(
      sessao.usuario,
      { name: sessao.deviceInfo },
      sessao.ipAddress,
      sessao.userAgent
    )

    // Revoga sessão antiga
    await prisma.sessao.update({
      where: { id: sessao.id },
      data: { revokedAt: new Date() },
    })

    return {
      user: this.sanitizeUser(sessao.usuario),
      tokens,
    }
  },

  /**
   * Gera fingerprint do dispositivo
   */
  generateDeviceFingerprint(deviceInfo, userAgent) {
    const data = `${deviceInfo?.name || ''}-${deviceInfo?.type || ''}-${userAgent || ''}`
    return Buffer.from(data).toString('base64').substring(0, 32)
  },

  /**
   * Atualiza acesso do dispositivo
   */
  async updateDeviceAccess(userId, deviceInfo, userAgent, ipAddress) {
    const fingerprint = this.generateDeviceFingerprint(deviceInfo, userAgent)

    await prisma.dispositivo.updateMany({
      where: { usuarioId: userId, fingerprint },
      data: {
        ultimoAcesso: new Date(),
        ipUltimo: ipAddress,
      },
    })
  },

  /**
   * Remove dados sensíveis do usuário
   */
  sanitizeUser(usuario) {
    const { senha, twoFactorSecret, webauthnCredentials, ...safe } = usuario
    return safe
  },
}
