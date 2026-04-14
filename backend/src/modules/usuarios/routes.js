import { authenticate, authorize } from '../../middlewares/auth.js'
import { usuarioController } from './controller.js'

export async function usuarioRoutes(app) {
  app.addHook('preHandler', authenticate)

  app.get('/perfil', usuarioController.meuPerfil)
  app.put('/perfil', usuarioController.atualizarPerfil)
  app.get('/', usuarioController.listar)
  app.get('/:id', usuarioController.buscar)
  app.post('/', { preHandler: [authorize('admin_escritorio', 'super_admin')] }, usuarioController.criar)
  app.put('/:id', { preHandler: [authorize('admin_escritorio', 'super_admin')] }, usuarioController.atualizar)
  app.delete('/:id', { preHandler: [authorize('admin_escritorio', 'super_admin')] }, usuarioController.excluir)
}
