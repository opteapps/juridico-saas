import { authenticate, blockSuperAdmin } from '../../middlewares/auth.js'
import { processoController } from './controller.js'

export async function processoRoutes(app) {
  app.addHook('preHandler', authenticate)
  app.addHook('preHandler', blockSuperAdmin)
  
  app.get('/', processoController.listar)
  app.get('/:id', processoController.buscar)
  app.post('/', processoController.criar)
  app.put('/:id', processoController.atualizar)
  app.delete('/:id', processoController.excluir)
  app.get('/:id/movimentacoes', processoController.movimentacoes)
  app.get('/:id/prazos', processoController.prazos)
  app.post('/:id/monitorar', processoController.ativarMonitoramento)
  app.post('/buscar-numero', processoController.buscarPorNumero)
}
