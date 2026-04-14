import { authenticate } from '../../middlewares/auth.js'
import { authController } from './controller.js'

export async function authRoutes(app) {
  // Autenticação básica
  app.post('/login', authController.login)
  app.post('/register', authController.register)
  app.post('/refresh', authController.refresh)
  app.post('/logout', { preHandler: [authenticate] }, authController.logout)
  app.get('/me', { preHandler: [authenticate] }, authController.me)
  
  // Recuperação de senha
  app.post('/forgot-password', authController.forgotPassword)
  app.post('/reset-password', authController.resetPassword)
  
  // Two-Factor Authentication (2FA)
  app.post('/2fa/verify', authController.verifyTwoFactor)
  app.post('/2fa/setup', { preHandler: [authenticate] }, authController.setupTwoFactor)
  app.post('/2fa/confirm', { preHandler: [authenticate] }, authController.confirmTwoFactor)
  app.post('/2fa/disable', { preHandler: [authenticate] }, authController.disableTwoFactor)
  
  // Gerenciamento de dispositivos
  app.post('/device/verify', authController.verifyDevice)
  app.get('/devices', { preHandler: [authenticate] }, authController.listDevices)
  app.delete('/devices/:deviceId', { preHandler: [authenticate] }, authController.revokeDevice)
  app.post('/logout-all', { preHandler: [authenticate] }, authController.logoutAllDevices)
  
  // WebAuthn / Biometria
  app.post('/webauthn/register', { preHandler: [authenticate] }, authController.webauthnRegister)
  app.post('/webauthn/authenticate', authController.webauthnAuthenticate)
}
