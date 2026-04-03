import { authenticate, blockSuperAdmin } from '../../middlewares/auth.js'
import { diligenciaController } from './controller.js'

export async function diligenciaRoutes(app) {
  app.addHook('preHandler', authenticate)
  app.addHook('preHandler', blockSuperAdmin)

  app.get('/', diligenciaController.listar)
  app.post('/', diligenciaController.criar)
  app.put('/:id', diligenciaController.atualizar)
  app.delete('/:id', diligenciaController.excluir)
}
