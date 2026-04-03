import { authenticate, requirePermission, blockSuperAdmin } from '../../middlewares/auth.js'
import { PERMISSIONS } from '../../config/permissions.js'
import { crmController } from './controller.js'

export async function crmRoutes(app) {
  // Rotas públicas (formulário de captura)
  app.post('/publico/leads', crmController.criarLeadPublico)
  app.post('/publico/propostas/:token/aceitar', crmController.aceitarPropostaPublico)

  // Middleware de autenticação para rotas protegidas
  app.addHook('preHandler', authenticate)
  app.addHook('preHandler', blockSuperAdmin)

  // Dashboard e estatísticas
  app.get('/estatisticas', crmController.estatisticas)
  app.get('/pipeline', crmController.obterPipeline)

  // Leads
  app.get('/leads', crmController.listarLeads)
  app.post('/leads',
    { preHandler: [requirePermission(PERMISSIONS.CLIENTES_CREATE)] },
    crmController.criarLead
  )
  app.get('/leads/:id', crmController.obterLead)
  app.put('/leads/:id',
    { preHandler: [requirePermission(PERMISSIONS.CLIENTES_EDIT)] },
    crmController.atualizarLead
  )
  app.post('/leads/:id/distribuir',
    { preHandler: [requirePermission(PERMISSIONS.CLIENTES_EDIT)] },
    crmController.distribuirLead
  )
  app.post('/leads/:id/mover',
    { preHandler: [requirePermission(PERMISSIONS.CLIENTES_EDIT)] },
    crmController.moverPipeline
  )
  app.post('/leads/:id/qualificar',
    { preHandler: [requirePermission(PERMISSIONS.CLIENTES_EDIT)] },
    crmController.qualificarLead
  )
  app.post('/leads/:id/converter',
    { preHandler: [requirePermission(PERMISSIONS.CLIENTES_EDIT)] },
    crmController.converterLead
  )

  // Atendimentos
  app.get('/leads/:id/atendimentos', crmController.listarAtendimentos)
  app.post('/leads/:id/atendimentos',
    { preHandler: [requirePermission(PERMISSIONS.CLIENTES_EDIT)] },
    crmController.registrarAtendimento
  )

  // Propostas
  app.get('/leads/:id/propostas', crmController.listarPropostas)
  app.post('/leads/:id/propostas',
    { preHandler: [requirePermission(PERMISSIONS.CLIENTES_EDIT)] },
    crmController.criarProposta
  )
  app.post('/propostas/:propostaId/enviar',
    { preHandler: [requirePermission(PERMISSIONS.CLIENTES_EDIT)] },
    crmController.enviarProposta
  )

  // Tarefas
  app.get('/leads/:id/tarefas', crmController.listarTarefas)
  app.post('/leads/:id/tarefas',
    { preHandler: [requirePermission(PERMISSIONS.CLIENTES_EDIT)] },
    crmController.criarTarefa
  )
  app.put('/tarefas/:tarefaId/concluir',
    { preHandler: [requirePermission(PERMISSIONS.CLIENTES_EDIT)] },
    crmController.concluirTarefa
  )
}
