import { authenticate, blockSuperAdmin } from '../../middlewares/auth.js'
import { iaController } from './controller.js'

export async function iaRoutes(app) {
  app.addHook('preHandler', authenticate)
  app.addHook('preHandler', blockSuperAdmin)
  
  app.post('/chat', iaController.chat)
  app.post('/resumir-processo/:id', iaController.resumirProcesso)
  app.post('/classificar-movimentacao', iaController.classificarMovimentacao)
  app.post('/sugerir-prazos', iaController.sugerirPrazos)
}
