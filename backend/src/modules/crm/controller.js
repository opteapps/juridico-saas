import { crmService } from '../../services/crmService.js'

export const crmController = {
  // ==================== LEADS ====================

  async listarLeads(request, reply) {
    const { tenantId } = request.usuario
    const filtros = request.query

    const leads = await crmService.listarLeads(tenantId, filtros)
    return reply.send(leads)
  },

  async obterLead(request, reply) {
    const { id } = request.params
    const { tenantId } = request.usuario

    const lead = await crmService.obterLead(id, tenantId)
    return reply.send(lead)
  },

  async criarLead(request, reply) {
    const { tenantId } = request.usuario
    const dados = request.body

    const lead = await crmService.criarLead(tenantId, dados, request.usuario.id)
    return reply.status(201).send(lead)
  },

  async atualizarLead(request, reply) {
    const { id } = request.params
    const { tenantId } = request.usuario
    const dados = request.body

    await crmService.atualizarLead(id, tenantId, dados, request.usuario.id)
    return reply.send({ sucesso: true })
  },

  async distribuirLead(request, reply) {
    const { id } = request.params
    const { tenantId } = request.usuario
    const { responsavelId } = request.body

    await crmService.distribuirLead(id, tenantId, responsavelId, request.usuario.id)
    return reply.send({ sucesso: true })
  },

  async moverPipeline(request, reply) {
    const { id } = request.params
    const { tenantId } = request.usuario
    const { status, ...dados } = request.body

    await crmService.moverPipeline(id, tenantId, status, dados, request.usuario.id)
    return reply.send({ sucesso: true })
  },

  async qualificarLead(request, reply) {
    const { id } = request.params
    const { tenantId } = request.usuario
    const dados = request.body

    await crmService.qualificarLead(id, tenantId, dados, request.usuario.id)
    return reply.send({ sucesso: true })
  },

  async converterLead(request, reply) {
    const { id } = request.params
    const { tenantId } = request.usuario
    const dados = request.body

    await crmService.converterLead(id, tenantId, dados, request.usuario.id)
    return reply.send({ sucesso: true })
  },

  // ==================== PIPELINE ====================

  async obterPipeline(request, reply) {
    const { tenantId } = request.usuario

    const leads = await crmService.listarLeads(tenantId, {})
    
    // Agrupa por status
    const pipeline = {
      novo: [],
      em_contato: [],
      triagem: [],
      proposta_enviada: [],
      negociacao: [],
      contrato_pendente: [],
      fechado: [],
      perdido: [],
    }

    leads.forEach(lead => {
      if (pipeline[lead.status]) {
        pipeline[lead.status].push(lead)
      }
    })

    return reply.send(pipeline)
  },

  // ==================== ATENDIMENTOS ====================

  async listarAtendimentos(request, reply) {
    const { id } = request.params
    const { tenantId } = request.usuario

    const atendimentos = await prisma.atendimento.findMany({
      where: { leadId: id, tenantId },
      include: {
        atendente: { select: { id: true, nome: true } },
      },
      orderBy: { data: 'desc' },
    })

    return reply.send(atendimentos)
  },

  async registrarAtendimento(request, reply) {
    const { id } = request.params
    const { tenantId } = request.usuario
    const dados = request.body

    const atendimento = await crmService.registrarAtendimento(id, tenantId, dados, request.usuario.id)
    return reply.status(201).send(atendimento)
  },

  // ==================== PROPOSTAS ====================

  async listarPropostas(request, reply) {
    const { id } = request.params
    const { tenantId } = request.usuario

    const propostas = await prisma.propostaComercial.findMany({
      where: { leadId: id, tenantId },
      include: {
        elaboradoPor: { select: { id: true, nome: true } },
      },
      orderBy: { criadoEm: 'desc' },
    })

    return reply.send(propostas)
  },

  async criarProposta(request, reply) {
    const { id } = request.params
    const { tenantId } = request.usuario
    const dados = request.body

    const proposta = await crmService.criarProposta(tenantId, id, dados, request.usuario.id)
    return reply.status(201).send(proposta)
  },

  async enviarProposta(request, reply) {
    const { propostaId } = request.params
    const { tenantId } = request.usuario

    const result = await crmService.enviarProposta(propostaId, tenantId, request.usuario.id)
    return reply.send(result)
  },

  async aceitarPropostaPublico(request, reply) {
    const { token } = request.params
    const ip = request.ip

    try {
      await crmService.aceitarProposta(token, ip)
      return reply.send({ 
        sucesso: true, 
        mensagem: 'Proposta aceita com sucesso! Entraremos em contato em breve.' 
      })
    } catch (error) {
      return reply.status(400).send({ error: error.message })
    }
  },

  // ==================== TAREFAS ====================

  async listarTarefas(request, reply) {
    const { id } = request.params

    const tarefas = await prisma.tarefaLead.findMany({
      where: { leadId: id },
      orderBy: { dataVencimento: 'asc' },
    })

    return reply.send(tarefas)
  },

  async criarTarefa(request, reply) {
    const { id } = request.params
    const dados = request.body

    const tarefa = await crmService.criarTarefaLead(id, dados)
    return reply.status(201).send(tarefa)
  },

  async concluirTarefa(request, reply) {
    const { tarefaId } = request.params

    await crmService.concluirTarefa(tarefaId)
    return reply.send({ sucesso: true })
  },

  // ==================== ESTATÍSTICAS ====================

  async estatisticas(request, reply) {
    const { tenantId } = request.usuario
    const { dataInicio, dataFim } = request.query

    const stats = await crmService.obterEstatisticas(tenantId, { dataInicio, dataFim })
    return reply.send(stats)
  },

  // ==================== FORMULÁRIO PÚBLICO ====================

  async criarLeadPublico(request, reply) {
    // Endpoint público para formulário de captura
    const { tenantId } = request.body // Identificado via domínio ou token
    const dados = request.body

    const lead = await crmService.criarLead(tenantId, dados, null)
    return reply.status(201).send({ 
      sucesso: true, 
      mensagem: 'Recebemos sua solicitação! Entraremos em contato em breve.' 
    })
  },
}
