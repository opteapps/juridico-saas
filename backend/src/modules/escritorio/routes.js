import { authenticate, requirePermission, blockSuperAdmin } from '../../middlewares/auth.js'
import { PERMISSIONS } from '../../config/permissions.js'
import { escritorioController } from './controller.js'

export async function escritorioRoutes(app) {
  app.addHook('preHandler', authenticate)
  app.addHook('preHandler', blockSuperAdmin)

  // Dados do escritório
  app.get('/', escritorioController.getDadosEscritorio)
  app.put('/', 
    { preHandler: [requirePermission(PERMISSIONS.CONFIG_EDIT)] },
    escritorioController.updateDadosEscritorio
  )

  // Unidades
  app.get('/unidades', escritorioController.listUnidades)
  app.post('/unidades',
    { preHandler: [requirePermission(PERMISSIONS.CONFIG_EDIT)] },
    escritorioController.createUnidade
  )
  app.put('/unidades/:id',
    { preHandler: [requirePermission(PERMISSIONS.CONFIG_EDIT)] },
    escritorioController.updateUnidade
  )
  app.delete('/unidades/:id',
    { preHandler: [requirePermission(PERMISSIONS.CONFIG_EDIT)] },
    escritorioController.deleteUnidade
  )

  // Áreas de atuação
  app.get('/areas-atuacao', escritorioController.listAreasAtuacao)
  app.post('/areas-atuacao',
    { preHandler: [requirePermission(PERMISSIONS.CONFIG_EDIT)] },
    escritorioController.createAreaAtuacao
  )
  app.put('/areas-atuacao/:id',
    { preHandler: [requirePermission(PERMISSIONS.CONFIG_EDIT)] },
    escritorioController.updateAreaAtuacao
  )
  app.delete('/areas-atuacao/:id',
    { preHandler: [requirePermission(PERMISSIONS.CONFIG_EDIT)] },
    escritorioController.deleteAreaAtuacao
  )

  // Especialidades
  app.post('/especialidades',
    { preHandler: [requirePermission(PERMISSIONS.CONFIG_EDIT)] },
    escritorioController.createEspecialidade
  )
  app.put('/especialidades/:id',
    { preHandler: [requirePermission(PERMISSIONS.CONFIG_EDIT)] },
    escritorioController.updateEspecialidade
  )
  app.delete('/especialidades/:id',
    { preHandler: [requirePermission(PERMISSIONS.CONFIG_EDIT)] },
    escritorioController.deleteEspecialidade
  )

  // Equipes
  app.get('/equipes', escritorioController.listEquipes)
  app.post('/equipes',
    { preHandler: [requirePermission(PERMISSIONS.CONFIG_EDIT)] },
    escritorioController.createEquipe
  )
  app.put('/equipes/:id',
    { preHandler: [requirePermission(PERMISSIONS.CONFIG_EDIT)] },
    escritorioController.updateEquipe
  )
  app.delete('/equipes/:id',
    { preHandler: [requirePermission(PERMISSIONS.CONFIG_EDIT)] },
    escritorioController.deleteEquipe
  )

  // Centros de custo
  app.get('/centros-custo', escritorioController.listCentrosCusto)
  app.post('/centros-custo',
    { preHandler: [requirePermission(PERMISSIONS.CONFIG_EDIT)] },
    escritorioController.createCentroCusto
  )
  app.put('/centros-custo/:id',
    { preHandler: [requirePermission(PERMISSIONS.CONFIG_EDIT)] },
    escritorioController.updateCentroCusto
  )
  app.delete('/centros-custo/:id',
    { preHandler: [requirePermission(PERMISSIONS.CONFIG_EDIT)] },
    escritorioController.deleteCentroCusto
  )

  // Modelos de contrato
  app.get('/modelos-contrato', escritorioController.listModelosContrato)
  app.post('/modelos-contrato',
    { preHandler: [requirePermission(PERMISSIONS.CONFIG_EDIT)] },
    escritorioController.createModeloContrato
  )
  app.put('/modelos-contrato/:id',
    { preHandler: [requirePermission(PERMISSIONS.CONFIG_EDIT)] },
    escritorioController.updateModeloContrato
  )
  app.delete('/modelos-contrato/:id',
    { preHandler: [requirePermission(PERMISSIONS.CONFIG_EDIT)] },
    escritorioController.deleteModeloContrato
  )

  // Modelos de tarefa
  app.get('/modelos-tarefa', escritorioController.listModelosTarefa)
  app.post('/modelos-tarefa',
    { preHandler: [requirePermission(PERMISSIONS.CONFIG_EDIT)] },
    escritorioController.createModeloTarefa
  )
  app.put('/modelos-tarefa/:id',
    { preHandler: [requirePermission(PERMISSIONS.CONFIG_EDIT)] },
    escritorioController.updateModeloTarefa
  )
  app.delete('/modelos-tarefa/:id',
    { preHandler: [requirePermission(PERMISSIONS.CONFIG_EDIT)] },
    escritorioController.deleteModeloTarefa
  )

  // Configurações
  app.get('/configuracoes', escritorioController.getConfiguracoes)
  app.put('/configuracoes/:categoria/:chave',
    { preHandler: [requirePermission(PERMISSIONS.CONFIG_EDIT)] },
    escritorioController.updateConfiguracao
  )
  app.put('/configuracoes/:categoria',
    { preHandler: [requirePermission(PERMISSIONS.CONFIG_EDIT)] },
    escritorioController.updateConfiguracoesBulk
  )
  app.post('/configuracoes/inicializar',
    { preHandler: [requirePermission(PERMISSIONS.CONFIG_EDIT)] },
    escritorioController.inicializarConfiguracoes
  )
}
