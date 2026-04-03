import { authenticate, blockSuperAdmin } from '../../middlewares/auth.js'
import { juriController } from './controller.js'

export async function juriRoutes(app) {
  app.addHook('preHandler', authenticate)
  app.addHook('preHandler', blockSuperAdmin)

  app.get('/dashboard', juriController.dashboard)
  app.get('/taxa-sucesso', juriController.taxaSucesso)
  app.get('/produtividade', juriController.produtividade)
  app.get('/fluxo-caixa', juriController.fluxoCaixa)
}
