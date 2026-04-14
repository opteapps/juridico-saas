import { authenticate, requirePermission, blockSuperAdmin } from '../../middlewares/auth.js'
import { PERMISSIONS } from '../../config/permissions.js'
import { equipeController } from './controller.js'

export async function equipeRoutes(app) {
  app.addHook('preHandler', authenticate)
  app.addHook('preHandler', blockSuperAdmin)

  // Listagem e busca
  app.get('/', 
    { preHandler: [requirePermission(PERMISSIONS.USUARIOS_VIEW)] },
    equipeController.listar
  )
  app.get('/estatisticas',
    { preHandler: [requirePermission(PERMISSIONS.USUARIOS_VIEW)] },
    equipeController.estatisticas
  )
  app.get('/roles', equipeController.listarRoles)
  app.get('/advogados', equipeController.listarAdvogados)
  app.get('/correspondentes', equipeController.listarCorrespondentes)
  app.get('/hierarquia', 
    { preHandler: [requirePermission(PERMISSIONS.USUARIOS_VIEW)] },
    equipeController.obterHierarquia
  )

  // CRUD membros
  app.get('/:id', 
    { preHandler: [requirePermission(PERMISSIONS.USUARIOS_VIEW)] },
    equipeController.obter
  )
  app.post('/',
    { preHandler: [requirePermission(PERMISSIONS.USUARIOS_CREATE)] },
    equipeController.criar
  )
  app.put('/:id',
    { preHandler: [requirePermission(PERMISSIONS.USUARIOS_EDIT)] },
    equipeController.atualizar
  )
  app.delete('/:id',
    { preHandler: [requirePermission(PERMISSIONS.USUARIOS_DELETE)] },
    equipeController.desativar
  )

  // Hierarquia
  app.put('/:id/supervisor',
    { preHandler: [requirePermission(PERMISSIONS.USUARIOS_EDIT)] },
    equipeController.atualizarSupervisor
  )

  // Documentos internos
  app.get('/:id/documentos', equipeController.listarDocumentos)
  app.post('/:id/documentos',
    { preHandler: [requirePermission(PERMISSIONS.USUARIOS_EDIT)] },
    equipeController.adicionarDocumento
  )
  app.delete('/:id/documentos/:documentoId',
    { preHandler: [requirePermission(PERMISSIONS.USUARIOS_EDIT)] },
    equipeController.removerDocumento
  )

  // Histórico profissional
  app.get('/:id/historico', equipeController.listarHistorico)
  app.post('/:id/historico',
    { preHandler: [requirePermission(PERMISSIONS.USUARIOS_EDIT)] },
    equipeController.adicionarHistorico
  )

  // Metas
  app.get('/:id/metas', equipeController.listarMetas)
  app.post('/metas',
    { preHandler: [requirePermission(PERMISSIONS.USUARIOS_EDIT)] },
    equipeController.definirMeta
  )
  app.put('/metas/:metaId',
    { preHandler: [requirePermission(PERMISSIONS.USUARIOS_EDIT)] },
    equipeController.atualizarMeta
  )

  // Produtividade
  app.get('/:id/produtividade', equipeController.listarProdutividade)
  app.post('/produtividade',
    { preHandler: [requirePermission(PERMISSIONS.USUARIOS_EDIT)] },
    equipeController.registrarProdutividade
  )
}
