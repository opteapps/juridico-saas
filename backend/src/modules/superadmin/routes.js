import { authenticate, authorize } from '../../middlewares/auth.js'
import { superAdminController } from './controller.js'

export async function superAdminRoutes(app) {
  app.addHook('preHandler', authenticate)
  app.addHook('preHandler', authorize('super_admin'))

  app.get('/metricas', superAdminController.metricas)
  app.get('/tenants', superAdminController.listarTenants)
  app.put('/tenants/:id', superAdminController.atualizarTenant)
  app.patch('/tenants/:id/status', superAdminController.suspenderTenant)
  app.get('/planos', superAdminController.listarPlanos)
  app.post('/planos', superAdminController.criarPlano)
  app.put('/planos/:id', superAdminController.atualizarPlano)
  app.get('/estatisticas', superAdminController.estatisticasSistema)
  app.get('/tenants/:id', superAdminController.detalhesTenant)
  app.get('/cobrancas', superAdminController.listarCobrancas)
  app.patch('/cobrancas/:id/status', superAdminController.atualizarAssinatura)
  app.get('/auditoria', superAdminController.auditoria)
  app.get('/lgpd/solicitacoes', superAdminController.listarSolicitacoesLGPD)
}
