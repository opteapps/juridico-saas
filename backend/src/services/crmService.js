import { prisma } from '../database/prisma.js'
import { auditService } from './auditService.js'
import { v4 as uuidv4 } from 'uuid'

/**
 * Serviço de CRM Jurídico
 * Gerencia leads, pipeline comercial e pré-atendimento
 */
export const crmService = {
  // ==================== LEADS ====================

  async listarLeads(tenantId, filtros = {}) {
    const {
      status,
      origem,
      areaAtuacaoId,
      urgencia,
      potencial,
      responsavelId,
      search,
      dataInicio,
      dataFim,
    } = filtros

    const where = { tenantId, ativo: true }

    if (status) where.status = status
    if (origem) where.origem = origem
    if (areaAtuacaoId) where.areaAtuacaoId = areaAtuacaoId
    if (urgencia) where.urgencia = urgencia
    if (potencial) where.potencialFinanceiro = potencial
    if (responsavelId) where.responsavelId = responsavelId
    if (search) {
      where.OR = [
        { nome: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { telefone: { contains: search } },
      ]
    }
    if (dataInicio || dataFim) {
      where.criadoEm = {}
      if (dataInicio) where.criadoEm.gte = new Date(dataInicio)
      if (dataFim) where.criadoEm.lte = new Date(dataFim)
    }

    const leads = await prisma.lead.findMany({
      where,
      include: {
        areaAtuacao: { select: { id: true, nome: true, cor: true } },
        responsavel: { select: { id: true, nome: true, avatarUrl: true } },
        _count: {
          select: {
            atendimentos: true,
            propostas: true,
            tarefas: { where: { status: 'pendente' } },
          },
        },
      },
      orderBy: { criadoEm: 'desc' },
    })

    return leads
  },

  async obterLead(leadId, tenantId) {
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, tenantId },
      include: {
        areaAtuacao: true,
        responsavel: true,
        atendimentos: {
          include: {
            atendente: { select: { id: true, nome: true } },
          },
          orderBy: { data: 'desc' },
        },
        propostas: {
          orderBy: { criadoEm: 'desc' },
        },
        tarefas: {
          orderBy: { dataVencimento: 'asc' },
        },
      },
    })

    if (!lead) throw new Error('Lead não encontrado')

    return lead
  },

  async criarLead(tenantId, dados, criadoPorId) {
    const lead = await prisma.lead.create({
      data: {
        tenantId,
        ...dados,
        status: 'novo',
      },
    })

    // Cria tarefa de follow-up automática
    await this.criarTarefaLead(lead.id, {
      titulo: 'Primeiro contato com lead',
      tipo: 'ligar',
      dataVencimento: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
      responsavelId: criadoPorId,
    })

    await auditService.log(criadoPorId, 'CREATE', 'Lead', lead.id, { tenantId })

    return lead
  },

  async atualizarLead(leadId, tenantId, dados, atualizadoPorId) {
    const lead = await prisma.lead.updateMany({
      where: { id: leadId, tenantId },
      data: {
        ...dados,
        atualizadoEm: new Date(),
      },
    })

    await auditService.log(atualizadoPorId, 'UPDATE', 'Lead', leadId, {
      tenantId,
      changes: Object.keys(dados),
    })

    return { sucesso: true }
  },

  async distribuirLead(leadId, tenantId, responsavelId, distribuidoPorId) {
    const lead = await prisma.lead.updateMany({
      where: { id: leadId, tenantId },
      data: {
        responsavelId,
        distribuidoEm: new Date(),
        status: 'em_contato',
        atualizadoEm: new Date(),
      },
    })

    // Cria notificação para o responsável
    await prisma.notificacao.create({
      data: {
        tenantId,
        usuarioId: responsavelId,
        tipo: 'LEAD_DISTRIBUIDO',
        titulo: 'Novo lead atribuído',
        mensagem: 'Um novo lead foi atribuído a você',
      },
    })

    await auditService.log(distribuidoPorId, 'DISTRIBUTE', 'Lead', leadId, {
      tenantId,
      responsavelId,
    })

    return { sucesso: true }
  },

  async moverPipeline(leadId, tenantId, novoStatus, dados = {}, movidoPorId) {
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, tenantId },
    })

    if (!lead) throw new Error('Lead não encontrado')

    const updateData = {
      status: novoStatus,
      atualizadoEm: new Date(),
    }

    if (novoStatus === 'perdido') {
      updateData.motivoPerda = dados.motivoPerda
    }

    if (novoStatus === 'fechado') {
      updateData.clienteConvertidoId = dados.clienteId
      updateData.convertidoEm = new Date()
    }

    await prisma.lead.updateMany({
      where: { id: leadId, tenantId },
      data: updateData,
    })

    await auditService.log(movidoPorId, 'PIPELINE_MOVE', 'Lead', leadId, {
      tenantId,
      de: lead.status,
      para: novoStatus,
    })

    return { sucesso: true }
  },

  async qualificarLead(leadId, tenantId, dados, qualificadoPorId) {
    const { urgencia, potencialFinanceiro, valorEstimado, analisePreliminar, risco, viabilidade } = dados

    await prisma.lead.updateMany({
      where: { id: leadId, tenantId },
      data: {
        urgencia,
        potencialFinanceiro,
        valorEstimado,
        analisePreliminar,
        risco,
        viabilidade,
        status: 'triagem',
        atualizadoEm: new Date(),
      },
    })

    await auditService.log(qualificadoPorId, 'QUALIFY', 'Lead', leadId, { tenantId })

    return { sucesso: true }
  },

  // ==================== ATENDIMENTOS ====================

  async registrarAtendimento(leadId, tenantId, dados, atendenteId) {
    const atendimento = await prisma.atendimento.create({
      data: {
        tenantId,
        leadId,
        atendenteId,
        ...dados,
      },
    })

    // Atualiza lead
    await prisma.lead.updateMany({
      where: { id: leadId, tenantId },
      data: {
        status: 'em_contato',
        proximoContato: dados.agendarRetorno,
        atualizadoEm: new Date(),
      },
    })

    await auditService.log(atendenteId, 'CREATE', 'Atendimento', atendimento.id, {
      tenantId,
      leadId,
    })

    return atendimento
  },

  // ==================== PROPOSTAS ====================

  async criarProposta(tenantId, leadId, dados, elaboradoPorId) {
    const numero = await this.gerarNumeroProposta(tenantId)

    const proposta = await prisma.propostaComercial.create({
      data: {
        tenantId,
        leadId,
        numero,
        elaboradoPorId,
        ...dados,
        status: 'rascunho',
      },
    })

    await auditService.log(elaboradoPorId, 'CREATE', 'PropostaComercial', proposta.id, {
      tenantId,
      leadId,
      valor: dados.valorTotal,
    })

    return proposta
  },

  async enviarProposta(propostaId, tenantId, enviadoPorId) {
    const token = uuidv4()
    const dataExpiracao = new Date()
    dataExpiracao.setDate(dataExpiracao.getDate() + 7) // 7 dias

    const proposta = await prisma.propostaComercial.updateMany({
      where: { id: propostaId, tenantId },
      data: {
        status: 'enviada',
        dataEnvio: new Date(),
        dataExpiracao,
        tokenAceite: token,
      },
    })

    // Atualiza lead
    const propostaData = await prisma.propostaComercial.findUnique({
      where: { id: propostaId },
    })

    await prisma.lead.updateMany({
      where: { id: propostaData.leadId, tenantId },
      data: {
        status: 'proposta_enviada',
        atualizadoEm: new Date(),
      },
    })

    await auditService.log(enviadoPorId, 'SEND', 'PropostaComercial', propostaId, { tenantId })

    return { token, dataExpiracao }
  },

  async aceitarProposta(token, ip) {
    const proposta = await prisma.propostaComercial.findUnique({
      where: { tokenAceite: token },
    })

    if (!proposta) throw new Error('Proposta não encontrada')
    if (proposta.status !== 'enviada') throw new Error('Proposta não disponível para aceite')
    if (proposta.dataExpiracao < new Date()) throw new Error('Proposta expirada')

    await prisma.propostaComercial.update({
      where: { id: proposta.id },
      data: {
        status: 'aceita',
        dataAceite: new Date(),
        ipAceite: ip,
      },
    })

    // Atualiza lead
    await prisma.lead.update({
      where: { id: proposta.leadId },
      data: {
        status: 'contrato_pendente',
        atualizadoEm: new Date(),
      },
    })

    await auditService.log(null, 'ACCEPT', 'PropostaComercial', proposta.id, { ip })

    return { sucesso: true }
  },

  // ==================== TAREFAS ====================

  async criarTarefaLead(leadId, dados) {
    const tarefa = await prisma.tarefaLead.create({
      data: {
        leadId,
        ...dados,
      },
    })

    return tarefa
  },

  async concluirTarefa(tarefaId) {
    await prisma.tarefaLead.update({
      where: { id: tarefaId },
      data: {
        status: 'concluida',
        concluidaEm: new Date(),
      },
    })

    return { sucesso: true }
  },

  // ==================== CONVERSÃO ====================

  async converterLead(leadId, tenantId, dados, convertidoPorId) {
    const { clienteId, processoId } = dados

    await prisma.lead.updateMany({
      where: { id: leadId, tenantId },
      data: {
        status: 'fechado',
        clienteConvertidoId: clienteId,
        convertidoEm: new Date(),
        ativo: false,
      },
    })

    await auditService.log(convertidoPorId, 'CONVERT', 'Lead', leadId, {
      tenantId,
      clienteId,
      processoId,
    })

    return { sucesso: true }
  },

  // ==================== ESTATÍSTICAS ====================

  async obterEstatisticas(tenantId, periodo = {}) {
    const { dataInicio, dataFim } = periodo

    const where = { tenantId, ativo: true }
    if (dataInicio || dataFim) {
      where.criadoEm = {}
      if (dataInicio) where.criadoEm.gte = new Date(dataInicio)
      if (dataFim) where.criadoEm.lte = new Date(dataFim)
    }

    const [
      totalLeads,
      leadsPorStatus,
      leadsPorOrigem,
      leadsPorArea,
      taxaConversao,
      valorPipeline,
    ] = await Promise.all([
      prisma.lead.count({ where }),
      prisma.lead.groupBy({
        by: ['status'],
        where,
        _count: { status: true },
      }),
      prisma.lead.groupBy({
        by: ['origem'],
        where,
        _count: { origem: true },
      }),
      prisma.lead.groupBy({
        by: ['areaAtuacaoId'],
        where: { ...where, areaAtuacaoId: { not: null } },
        _count: { areaAtuacaoId: true },
      }),
      prisma.lead.count({
        where: { ...where, status: 'fechado' },
      }),
      prisma.lead.aggregate({
        where: { ...where, status: { not: 'perdido' } },
        _sum: { valorEstimado: true },
      }),
    ])

    const totalFechados = taxaConversao
    const taxa = totalLeads > 0 ? (totalFechados / totalLeads) * 100 : 0

    return {
      totalLeads,
      leadsPorStatus,
      leadsPorOrigem,
      leadsPorArea,
      taxaConversao: taxa.toFixed(2),
      valorPipeline: valorPipeline._sum.valorEstimado || 0,
    }
  },

  // ==================== HELPERS ====================

  async gerarNumeroProposta(tenantId) {
    const ano = new Date().getFullYear()
    const count = await prisma.propostaComercial.count({
      where: {
        tenantId,
        criadoEm: {
          gte: new Date(`${ano}-01-01`),
          lt: new Date(`${ano + 1}-01-01`),
        },
      },
    })

    return `PROP-${ano}-${String(count + 1).padStart(4, '0')}`
  },
}
