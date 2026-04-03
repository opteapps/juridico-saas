import { prisma } from '../database/prisma.js'
import { auditService } from './auditService.js'
import bcrypt from 'bcryptjs'

/**
 * Serviço de Gestão de Equipe
 * Gerencia advogados, colaboradores e toda a equipe do escritório
 */
export const equipeService = {
  /**
   * Lista todos os membros da equipe
   */
  async listarEquipe(tenantId, filtros = {}) {
    const { 
      role, 
      unidadeId, 
      equipeId, 
      ativo = true, 
      supervisorId,
      areaAtuacao,
      search,
    } = filtros

    const where = { tenantId }
    
    if (role) where.role = role
    if (unidadeId) where.unidadeId = unidadeId
    if (equipeId) where.equipeId = equipeId
    if (ativo !== undefined) where.ativo = ativo
    if (supervisorId) where.supervisorId = supervisorId
    if (areaAtuacao) where.areasAtuacao = { has: areaAtuacao }
    if (search) {
      where.OR = [
        { nome: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { oab: { contains: search, mode: 'insensitive' } },
      ]
    }

    const membros = await prisma.usuario.findMany({
      where,
      include: {
        unidade: { select: { id: true, nome: true } },
        equipe: { select: { id: true, nome: true } },
        supervisor: { select: { id: true, nome: true } },
        _count: {
          select: {
            processosAdv: true,
            subordinados: true,
          },
        },
      },
      orderBy: { nome: 'asc' },
    })

    return membros
  },

  /**
   * Obtém detalhes de um membro da equipe
   */
  async obterMembro(usuarioId, tenantId) {
    const membro = await prisma.usuario.findFirst({
      where: { id: usuarioId, tenantId },
      include: {
        unidade: true,
        equipe: true,
        supervisor: true,
        subordinados: {
          where: { ativo: true },
          select: { id: true, nome: true, role: true, avatarUrl: true },
        },
        _count: {
          select: {
            processosAdv: true,
            documentosEnv: true,
            diligencias: true,
          },
        },
      },
    })

    if (!membro) throw new Error('Membro não encontrado')

    // Busca documentos internos
    const documentosInternos = await prisma.documentoInterno.findMany({
      where: { usuarioId, ativo: true },
      orderBy: { criadoEm: 'desc' },
    })

    // Busca histórico profissional
    const historico = await prisma.historicoProfissional.findMany({
      where: { usuarioId },
      orderBy: { data: 'desc' },
      take: 20,
    })

    // Busca metas atuais
    const metas = await prisma.metaUsuario.findMany({
      where: { usuarioId },
      orderBy: { periodo: 'desc' },
      take: 12,
    })

    // Busca produtividade recente
    const produtividade = await prisma.produtividade.findMany({
      where: { usuarioId },
      orderBy: { data: 'desc' },
      take: 30,
    })

    return {
      ...membro,
      documentosInternos,
      historico,
      metas,
      produtividade,
    }
  },

  /**
   * Cria novo membro da equipe
   */
  async criarMembro(tenantId, dados, criadoPorId) {
    // Verifica se email já existe
    const existente = await prisma.usuario.findFirst({
      where: { email: dados.email.toLowerCase(), tenantId },
    })

    if (existente) {
      throw new Error('Email já cadastrado neste escritório')
    }

    // Gera senha temporária
    const senhaTemp = Math.random().toString(36).slice(-8)
    const senhaHash = await bcrypt.hash(senhaTemp, 12)

    const membro = await prisma.usuario.create({
      data: {
        tenantId,
        ...dados,
        email: dados.email.toLowerCase(),
        senha: senhaHash,
        ativo: true,
        dataAdmissao: dados.dataAdmissao || new Date(),
      },
    })

    // Registra no histórico
    await prisma.historicoProfissional.create({
      data: {
        usuarioId: membro.id,
        tipo: 'admissao',
        data: membro.dataAdmissao,
        descricao: `Admissão como ${dados.role}`,
        registradoPorId: criadoPorId,
      },
    })

    await auditService.log(criadoPorId, 'CREATE', 'Usuario', membro.id, {
      tenantId,
      role: dados.role,
    })

    return {
      ...membro,
      senhaTemp, // Enviar por email em implementação real
    }
  },

  /**
   * Atualiza membro da equipe
   */
  async atualizarMembro(usuarioId, tenantId, dados, atualizadoPorId) {
    const membro = await prisma.usuario.findFirst({
      where: { id: usuarioId, tenantId },
    })

    if (!membro) throw new Error('Membro não encontrado')

    // Se estiver alterando o role, registra no histórico
    if (dados.role && dados.role !== membro.role) {
      await prisma.historicoProfissional.create({
        data: {
          usuarioId,
          tipo: 'promocao',
          data: new Date(),
          descricao: `Alteração de função: ${membro.role} → ${dados.role}`,
          dados: { roleAnterior: membro.role, roleNovo: dados.role },
          registradoPorId: atualizadoPorId,
        },
      })
    }

    // Se estiver alterando o supervisor, registra no histórico
    if (dados.supervisorId && dados.supervisorId !== membro.supervisorId) {
      await prisma.historicoProfissional.create({
        data: {
          usuarioId,
          tipo: 'transferencia',
          data: new Date(),
          descricao: 'Alteração de supervisor',
          registradoPorId: atualizadoPorId,
        },
      })
    }

    const atualizado = await prisma.usuario.update({
      where: { id: usuarioId },
      data: {
        ...dados,
        atualizadoEm: new Date(),
      },
    })

    await auditService.log(atualizadoPorId, 'UPDATE', 'Usuario', usuarioId, {
      tenantId,
      changes: Object.keys(dados),
    })

    return atualizado
  },

  /**
   * Desativa membro da equipe (demissão)
   */
  async desativarMembro(usuarioId, tenantId, dados, desativadoPorId) {
    const { dataDemissao, motivo } = dados

    const membro = await prisma.usuario.updateMany({
      where: { id: usuarioId, tenantId },
      data: {
        ativo: false,
        dataDemissao: dataDemissao || new Date(),
      },
    })

    await prisma.historicoProfissional.create({
      data: {
        usuarioId,
        tipo: 'demissao',
        data: dataDemissao || new Date(),
        descricao: `Desligamento: ${motivo || 'Não informado'}`,
        registradoPorId: desativadoPorId,
      },
    })

    // Revoga todas as sessões
    await prisma.sessao.deleteMany({ where: { usuarioId } })

    await auditService.log(desativadoPorId, 'DEACTIVATE', 'Usuario', usuarioId, {
      tenantId,
      motivo,
    })

    return { sucesso: true }
  },

  /**
   * Adiciona documento interno
   */
  async adicionarDocumento(usuarioId, tenantId, dados, adicionadoPorId) {
    const documento = await prisma.documentoInterno.create({
      data: {
        tenantId,
        usuarioId,
        ...dados,
      },
    })

    await auditService.log(adicionadoPorId, 'CREATE', 'DocumentoInterno', documento.id, {
      tenantId,
      usuarioId,
      tipo: dados.tipo,
    })

    return documento
  },

  /**
   * Remove documento interno
   */
  async removerDocumento(documentoId, tenantId, removidoPorId) {
    await prisma.documentoInterno.updateMany({
      where: { id: documentoId, tenantId },
      data: { ativo: false },
    })

    await auditService.log(removidoPorId, 'DELETE', 'DocumentoInterno', documentoId, { tenantId })
    return { sucesso: true }
  },

  /**
   * Adiciona registro ao histórico profissional
   */
  async adicionarHistorico(usuarioId, tenantId, dados, registradoPorId) {
    const historico = await prisma.historicoProfissional.create({
      data: {
        usuarioId,
        ...dados,
        registradoPorId,
      },
    })

    await auditService.log(registradoPorId, 'CREATE', 'HistoricoProfissional', historico.id, {
      tenantId,
      usuarioId,
      tipo: dados.tipo,
    })

    return historico
  },

  /**
   * Define meta para usuário
   */
  async definirMeta(tenantId, dados, definidoPorId) {
    const { usuarioId, periodo, tipo, valorMeta, observacoes } = dados

    // Verifica se já existe meta para este período/tipo
    const existente = await prisma.metaUsuario.findUnique({
      where: {
        usuarioId_periodo_tipo: {
          usuarioId,
          periodo,
          tipo,
        },
      },
    })

    if (existente) {
      // Atualiza meta existente
      const atualizada = await prisma.metaUsuario.update({
        where: { id: existente.id },
        data: {
          valorMeta,
          observacoes,
          status: 'pendente',
        },
      })

      await auditService.log(definidoPorId, 'UPDATE', 'MetaUsuario', atualizada.id, {
        tenantId,
        usuarioId,
      })

      return atualizada
    }

    // Cria nova meta
    const meta = await prisma.metaUsuario.create({
      data: {
        tenantId,
        usuarioId,
        periodo,
        tipo,
        valorMeta,
        observacoes,
        status: 'pendente',
      },
    })

    await auditService.log(definidoPorId, 'CREATE', 'MetaUsuario', meta.id, {
      tenantId,
      usuarioId,
      tipo,
      periodo,
    })

    return meta
  },

  /**
   * Atualiza progresso da meta
   */
  async atualizarProgressoMeta(metaId, valorRealizado) {
    const meta = await prisma.metaUsuario.findUnique({
      where: { id: metaId },
    })

    if (!meta) throw new Error('Meta não encontrada')

    const percentualAtingido = (Number(valorRealizado) / Number(meta.valorMeta)) * 100
    
    let status = 'pendente'
    if (percentualAtingido >= 100) status = 'atingida'
    else if (percentualAtingido >= 80) status = 'quase_atingida'
    else if (percentualAtingido < 50) status = 'nao_atingida'

    const atualizada = await prisma.metaUsuario.update({
      where: { id: metaId },
      data: {
        valorRealizado,
        percentualAtingido,
        status,
      },
    })

    return atualizada
  },

  /**
   * Registra produtividade diária
   */
  async registrarProdutividade(tenantId, dados) {
    const { usuarioId, data, ...valores } = dados

    const dataFormatada = new Date(data)
    dataFormatada.setHours(0, 0, 0, 0)

    const produtividade = await prisma.produtividade.upsert({
      where: {
        usuarioId_data: {
          usuarioId,
          data: dataFormatada,
        },
      },
      update: {
        ...valores,
      },
      create: {
        tenantId,
        usuarioId,
        data: dataFormatada,
        ...valores,
      },
    })

    return produtividade
  },

  /**
   * Obtém estatísticas da equipe
   */
  async obterEstatisticas(tenantId, periodo = {}) {
    const { dataInicio, dataFim } = periodo

    const wherePeriodo = {}
    if (dataInicio || dataFim) {
      wherePeriodo.data = {}
      if (dataInicio) wherePeriodo.data.gte = new Date(dataInicio)
      if (dataFim) wherePeriodo.data.lte = new Date(dataFim)
    }

    const [totalMembros, membrosAtivos, membrosPorRole, produtividadeTotal] = await Promise.all([
      prisma.usuario.count({ where: { tenantId } }),
      prisma.usuario.count({ where: { tenantId, ativo: true } }),
      prisma.usuario.groupBy({
        by: ['role'],
        where: { tenantId, ativo: true },
        _count: { role: true },
      }),
      prisma.produtividade.aggregate({
        where: {
          tenantId,
          ...wherePeriodo,
        },
        _sum: {
          horasTrabalhadas: true,
          processosAtuados: true,
          tarefasConcluidas: true,
          faturamentoGerado: true,
        },
      }),
    ])

    return {
      totalMembros,
      membrosAtivos,
      membrosPorRole,
      produtividadeTotal: {
        horasTrabalhadas: produtividadeTotal._sum.horasTrabalhadas || 0,
        processosAtuados: produtividadeTotal._sum.processosAtuados || 0,
        tarefasConcluidas: produtividadeTotal._sum.tarefasConcluidas || 0,
        faturamentoGerado: produtividadeTotal._sum.faturamentoGerado || 0,
      },
    }
  },

  /**
   * Lista advogados disponíveis para alocação
   */
  async listarAdvogadosDisponiveis(tenantId, areaAtuacao = null) {
    const where = {
      tenantId,
      ativo: true,
      role: { in: ['advogado', 'advogado_associado', 'socio', 'coordenador'] },
    }

    if (areaAtuacao) {
      where.areasAtuacao = { has: areaAtuacao }
    }

    const advogados = await prisma.usuario.findMany({
      where,
      select: {
        id: true,
        nome: true,
        email: true,
        oab: true,
        oabUf: true,
        avatarUrl: true,
        areasAtuacao: true,
        especialidades: true,
        _count: {
          select: {
            processosAdv: {
              where: {
                processo: {
                  status: { in: ['ativo', 'em_andamento'] },
                },
              },
            },
          },
        },
      },
      orderBy: { nome: 'asc' },
    })

    return advogados
  },

  /**
   * Lista correspondentes/diligencistas externos
   */
  async listarCorrespondentes(tenantId, filtros = {}) {
    const { cidade, estado, areaAtuacao } = filtros

    const where = {
      tenantId,
      ativo: true,
      role: { in: ['correspondente', 'diligencista'] },
    }

    if (cidade) where.cidade = { contains: cidade, mode: 'insensitive' }
    if (estado) where.estado = estado
    if (areaAtuacao) where.areasAtuacao = { has: areaAtuacao }

    const correspondentes = await prisma.usuario.findMany({
      where,
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        celular: true,
        cidade: true,
        estado: true,
        oab: true,
        oabUf: true,
        areasAtuacao: true,
        avatarUrl: true,
      },
      orderBy: { nome: 'asc' },
    })

    return correspondentes
  },
}
