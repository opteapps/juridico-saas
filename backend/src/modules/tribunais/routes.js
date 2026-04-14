import { authenticate, blockSuperAdmin } from '../../middlewares/auth.js'
import { tribunaisController } from './controller.js'

export async function tribunaisRoutes(app) {
  app.addHook('preHandler', authenticate)
  app.addHook('preHandler', blockSuperAdmin)

  // Listar tribunais disponíveis
  app.get('/', tribunaisController.listarTribunais)

  // Consultar processo em tribunais
  app.get('/consultar/:numero', tribunaisController.consultarProcesso)

  // Buscar movimentações
  app.get('/movimentacoes/:numero', tribunaisController.buscarMovimentacoes)

  // Sincronizar processo com tribunal
  app.post('/sincronizar/:processoId', tribunaisController.sincronizarProcesso)
}
