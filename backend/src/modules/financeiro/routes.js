import { authenticate, blockSuperAdmin } from '../../middlewares/auth.js'
import { financeiroController } from './controller.js'

export async function financeiroRoutes(app) {
  app.addHook('preHandler', authenticate)
  app.addHook('preHandler', blockSuperAdmin)

  app.get('/', financeiroController.listar)
  app.get('/resumo', financeiroController.resumo)
  app.get('/comissoes', financeiroController.comissoes)
  app.post('/', financeiroController.criar)
  app.put('/:id', financeiroController.atualizar)
  app.delete('/:id', financeiroController.excluir)
  app.patch('/:id/pagar', financeiroController.marcarPago)
}
