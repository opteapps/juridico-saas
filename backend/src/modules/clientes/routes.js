import { authenticate, blockSuperAdmin } from '../../middlewares/auth.js'
import { clienteController } from './controller.js'

export async function clienteRoutes(app) {
  app.addHook('preHandler', authenticate)
  app.addHook('preHandler', blockSuperAdmin)
  
  app.get('/', clienteController.listar)
  app.get('/:id', clienteController.buscar)
  app.post('/', clienteController.criar)
  app.put('/:id', clienteController.atualizar)
  app.delete('/:id', clienteController.excluir)
  app.get('/:id/processos', clienteController.processos)
  app.get('/:id/financeiro', clienteController.financeiro)
  app.post('/:id/buscar-processos', clienteController.buscarProcessosTribunal)
}
