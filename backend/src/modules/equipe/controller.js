import { equipeService } from '../../services/equipeService.js'
import { prisma } from '../../database/prisma.js'
import { ROLES, getRoleLabel } from '../../config/permissions.js'

export const equipeController = {
  /**
   * Lista todos os membros da equipe
   */
  async listar(request, reply) {
    const { tenantId } = request.usuario
    const filtros = request.query

    const membros = await equipeService.listarEquipe(tenantId, filtros)
    return reply.send(membros)
  },

  /**
   * Obtém detalhes de um membro
   */
  async obter(request, reply) {
    const { id } = request.params
    const { tenantId } = request.usuario

    const membro = await equipeService.obterMembro(id, tenantId)
    return reply.send(membro)
  },

  /**
   * Cria novo membro
   */
  async criar(request, reply) {
    const { tenantId } = request.usuario
    const dados = request.body

    const membro = await equipeService.criarMembro(tenantId, dados, request.usuario.id)
    
    // Remove senha da resposta
    const { senha, ...result } = membro

    return reply.status(201).send({
      ...result,
      mensagem: 'Membro criado com sucesso. Senha temporária gerada.',
    })
  },

  /**
   * Atualiza membro
   */
  async atualizar(request, reply) {
    const { id } = request.params
    const { tenantId } = request.usuario
    const dados = request.body

    const membro = await equipeService.atualizarMembro(id, tenantId, dados, request.usuario.id)
    return reply.send(membro)
  },

  /**
   * Desativa membro
   */
  async desativar(request, reply) {
    const { id } = request.params
    const { tenantId } = request.usuario
    const dados = request.body

    await equipeService.desativarMembro(id, tenantId, dados, request.usuario.id)
    return reply.send({ sucesso: true, mensagem: 'Membro desativado com sucesso' })
  },

  /**
   * Lista roles disponíveis
   */
  async listarRoles(request, reply) {
    const roles = Object.entries(ROLES).map(([key, value]) => ({
      key,
      value,
      label: getRoleLabel(value),
    }))

    return reply.send(roles)
  },

  /**
   * Obtém estatísticas da equipe
   */
  async estatisticas(request, reply) {
    const { tenantId } = request.usuario
    const { dataInicio, dataFim } = request.query

    const stats = await equipeService.obterEstatisticas(tenantId, { dataInicio, dataFim })
    return reply.send(stats)
  },

  // ==================== DOCUMENTOS INTERNOS ====================

  async listarDocumentos(request, reply) {
    const { id } = request.params
    const { tenantId } = request.usuario

    const documentos = await prisma.documentoInterno.findMany({
      where: { usuarioId: id, tenantId, ativo: true },
      orderBy: { criadoEm: 'desc' },
    })

    return reply.send(documentos)
  },

  async adicionarDocumento(request, reply) {
    const { id } = request.params
    const { tenantId } = request.usuario
    const dados = request.body

    const documento = await equipeService.adicionarDocumento(id, tenantId, dados, request.usuario.id)
    return reply.status(201).send(documento)
  },

  async removerDocumento(request, reply) {
    const { id, documentoId } = request.params
    const { tenantId } = request.usuario

    await equipeService.removerDocumento(documentoId, tenantId, request.usuario.id)
    return reply.send({ sucesso: true })
  },

  // ==================== HISTÓRICO PROFISSIONAL ====================

  async listarHistorico(request, reply) {
    const { id } = request.params
    const { tenantId } = request.usuario

    const historico = await prisma.historicoProfissional.findMany({
      where: { usuarioId: id },
      orderBy: { data: 'desc' },
    })

    return reply.send(historico)
  },

  async adicionarHistorico(request, reply) {
    const { id } = request.params
    const { tenantId } = request.usuario
    const dados = request.body

    const historico = await equipeService.adicionarHistorico(id, tenantId, dados, request.usuario.id)
    return reply.status(201).send(historico)
  },

  // ==================== METAS ====================

  async listarMetas(request, reply) {
    const { id } = request.params
    const { tenantId } = request.usuario

    const metas = await prisma.metaUsuario.findMany({
      where: { usuarioId: id, tenantId },
      orderBy: { periodo: 'desc' },
    })

    return reply.send(metas)
  },

  async definirMeta(request, reply) {
    const { tenantId } = request.usuario
    const dados = request.body

    const meta = await equipeService.definirMeta(tenantId, dados, request.usuario.id)
    return reply.status(201).send(meta)
  },

  async atualizarMeta(request, reply) {
    const { metaId } = request.params
    const { valorRealizado } = request.body

    const meta = await equipeService.atualizarProgressoMeta(metaId, valorRealizado)
    return reply.send(meta)
  },

  // ==================== PRODUTIVIDADE ====================

  async listarProdutividade(request, reply) {
    const { id } = request.params
    const { tenantId } = request.usuario
    const { dataInicio, dataFim } = request.query

    const where = { usuarioId: id, tenantId }
    if (dataInicio || dataFim) {
      where.data = {}
      if (dataInicio) where.data.gte = new Date(dataInicio)
      if (dataFim) where.data.lte = new Date(dataFim)
    }

    const produtividade = await prisma.produtividade.findMany({
      where,
      orderBy: { data: 'desc' },
    })

    return reply.send(produtividade)
  },

  async registrarProdutividade(request, reply) {
    const { tenantId } = request.usuario
    const dados = request.body

    const produtividade = await equipeService.registrarProdutividade(tenantId, dados)
    return reply.status(201).send(produtividade)
  },

  // ==================== ADVOCACIA ====================

  async listarAdvogados(request, reply) {
    const { tenantId } = request.usuario
    const { areaAtuacao } = request.query

    const advogados = await equipeService.listarAdvogadosDisponiveis(tenantId, areaAtuacao)
    return reply.send(advogados)
  },

  async listarCorrespondentes(request, reply) {
    const { tenantId } = request.usuario
    const filtros = request.query

    const correspondentes = await equipeService.listarCorrespondentes(tenantId, filtros)
    return reply.send(correspondentes)
  },

  // ==================== HIERARQUIA ====================

  async obterHierarquia(request, reply) {
    const { tenantId } = request.usuario

    // Busca todos os membros ativos com seus supervisores
    const membros = await prisma.usuario.findMany({
      where: { tenantId, ativo: true },
      select: {
        id: true,
        nome: true,
        role: true,
        avatarUrl: true,
        supervisorId: true,
        _count: {
          select: { subordinados: { where: { ativo: true } } },
        },
      },
    })

    // Monta estrutura hierárquica
    const hierarquia = membros.filter(m => !m.supervisorId)
    
    const adicionarSubordinados = (pai) => {
      pai.subordinados = membros
        .filter(m => m.supervisorId === pai.id)
        .map(adicionarSubordinados)
      return pai
    }

    return reply.send(hierarquia.map(adicionarSubordinados))
  },

  async atualizarSupervisor(request, reply) {
    const { id } = request.params
    const { tenantId } = request.usuario
    const { supervisorId } = request.body

    const membro = await equipeService.atualizarMembro(id, tenantId, { supervisorId }, request.usuario.id)
    return reply.send(membro)
  },
}
