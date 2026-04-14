import { authenticate, authorize, blockSuperAdmin } from '../../middlewares/auth.js'
import { tenantController } from './controller.js'

export async function tenantRoutes(app) {
  app.addHook('preHandler', authenticate)

  app.get('/meu', { preHandler: [blockSuperAdmin] }, tenantController.meuTenant)
  app.put('/meu', { preHandler: [authorize('admin_escritorio', 'super_admin')] }, tenantController.atualizar)
}
