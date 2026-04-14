import { authenticate, blockSuperAdmin } from '../../middlewares/auth.js'
import { notificacaoController } from './controller.js'

export async function notificacaoRoutes(app) {
  app.addHook('preHandler', authenticate)
  app.addHook('preHandler', blockSuperAdmin)

  app.get('/', notificacaoController.listar)
  app.patch('/:id/lida', notificacaoController.marcarLida)
  app.post('/marcar-todas-lidas', notificacaoController.marcarTodasLidas)
}
