import { authenticate, blockSuperAdmin } from '../../middlewares/auth.js'
import { movimentacaoController } from './controller.js'

export async function movimentacaoRoutes(app) {
  app.addHook('preHandler', authenticate)
  app.addHook('preHandler', blockSuperAdmin)

  app.get('/', movimentacaoController.listar)
  app.post('/', movimentacaoController.criar)
  app.patch('/:id/lida', movimentacaoController.marcarLida)
  app.post('/marcar-todas-lidas', movimentacaoController.marcarTodasLidas)
}
