import { authenticate, blockSuperAdmin } from '../../middlewares/auth.js'
import { agendaController } from './controller.js'

export async function agendaRoutes(app) {
  app.addHook('preHandler', authenticate)
  app.addHook('preHandler', blockSuperAdmin)

  app.get('/', agendaController.listar)
  app.post('/', agendaController.criar)
  app.put('/:id', agendaController.atualizar)
  app.delete('/:id', agendaController.excluir)
  app.get('/prazos-proximos', agendaController.prazosProximos)
}
