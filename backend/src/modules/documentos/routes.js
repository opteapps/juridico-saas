import { authenticate, blockSuperAdmin } from '../../middlewares/auth.js'
import { documentoController } from './controller.js'

export async function documentoRoutes(app) {
  app.addHook('preHandler', authenticate)
  app.addHook('preHandler', blockSuperAdmin)

  app.get('/', documentoController.listar)
  app.post('/upload', documentoController.upload)
  app.get('/:id/download', documentoController.download)
  app.delete('/:id', documentoController.excluir)
}
