import { authenticate } from '../../middlewares/auth.js'
import { authController } from './controller.js'

export async function authRoutes(app) {
  app.post('/login', authController.login)
  app.post('/register', authController.register)
  app.post('/refresh', authController.refresh)
  app.post('/logout', { preHandler: [authenticate] }, authController.logout)
  app.get('/me', { preHandler: [authenticate] }, authController.me)
  app.post('/forgot-password', authController.forgotPassword)
  app.post('/reset-password', authController.resetPassword)
  app.post('/webauthn/register', { preHandler: [authenticate] }, authController.webauthnRegister)
  app.post('/webauthn/authenticate', authController.webauthnAuthenticate)
}
