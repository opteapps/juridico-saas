import { prisma } from '../../database/prisma.js'
import { escritorioConfigService } from '../../services/escritorioConfigService.js'
import { auditService } from '../../services/auditService.js'

export const escritorioController = {
  /**
   * Obtém dados completos do escritório
   */
  async getDadosEscritorio(request, reply) {
    const { tenantId } = request.usuario

    const escritorio = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        unidades: {
          where: { ativa: true },
          orderBy: { nome: 'asc' },
        },
        areasAtuacao: {
          where: { ativa: true },
          orderBy: { ordem: 'asc' },
          include: {
            especialidades: {
              where: { ativa: true },
              orderBy: { ordem: 'asc' },
            },
          },
        },
        equipes: {
          where: { ativa: true },
          orderBy: { nome: 'asc' },
        },
        centrosCusto: {
          where: { ativo: true },
          orderBy: { codigo: 'asc' },
        },
        modelosContrato: {
          where: { ativo: true },
          orderBy: { nome: 'asc' },
        },
        modelosTarefa: {
          where: { ativo: true },
          orderBy: { nome: 'asc' },
        },
      },
    })

    // Busca configurações
    const configuracoes = await escritorioConfigService.getConfiguracoes(tenantId)

    return reply.send({
      ...escritorio,
      configuracoes,
    })
  },

  /**
   * Atualiza dados do escritório
   */
  async updateDadosEscritorio(request, reply) {
    const { tenantId } = request.usuario
    const dados = request.body

    const escritorio = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        nome: dados.nome,
        nomeFantasia: dados.nomeFantasia,
        cnpj: dados.cnpj,
        inscricaoEstadual: dados.inscricaoEstadual,
        inscricaoMunicipal: dados.inscricaoMunicipal,
        email: dados.email,
        telefone: dados.telefone,
        celular: dados.celular,
        endereco: dados.endereco,
        cidade: dados.cidade,
        estado: dados.estado,
        cep: dados.cep,
        website: dados.website,
        logoUrl: dados.logoUrl,
        oabEscritorio: dados.oabEscritorio,
        responsavelTecnicoId: dados.responsavelTecnicoId,
      },
    })

    await auditService.log(request.usuario.id, 'UPDATE', 'Tenant', tenantId, {
      tenantId,
      changes: dados,
    })

    return reply.send(escritorio)
  },

  // ==================== UNIDADES ====================

  async listUnidades(request, reply) {
    const { tenantId } = request.usuario
    const unidades = await prisma.unidade.findMany({
      where: { tenantId },
      orderBy: { nome: 'asc' },
    })
    return reply.send(unidades)
  },

  async createUnidade(request, reply) {
    const { tenantId } = request.usuario
    const dados = request.body

    const unidade = await prisma.unidade.create({
      data: {
        tenantId,
        ...dados,
      },
    })

    await auditService.log(request.usuario.id, 'CREATE', 'Unidade', unidade.id, { tenantId })
    return reply.status(201).send(unidade)
  },

  async updateUnidade(request, reply) {
    const { tenantId } = request.usuario
    const { id } = request.params
    const dados = request.body

    const unidade = await prisma.unidade.updateMany({
      where: { id, tenantId },
      data: dados,
    })

    return reply.send({ sucesso: true })
  },

  async deleteUnidade(request, reply) {
    const { tenantId } = request.usuario
    const { id } = request.params

    await prisma.unidade.updateMany({
      where: { id, tenantId },
      data: { ativa: false },
    })

    await auditService.log(request.usuario.id, 'DELETE', 'Unidade', id, { tenantId })
    return reply.send({ sucesso: true })
  },

  // ==================== ÁREAS DE ATUAÇÃO ====================

  async listAreasAtuacao(request, reply) {
    const { tenantId } = request.usuario
    const areas = await prisma.areaAtuacao.findMany({
      where: { tenantId },
      include: {
        especialidades: {
          where: { ativa: true },
          orderBy: { ordem: 'asc' },
        },
      },
      orderBy: { ordem: 'asc' },
    })
    return reply.send(areas)
  },

  async createAreaAtuacao(request, reply) {
    const { tenantId } = request.usuario
    const dados = request.body

    const area = await prisma.areaAtuacao.create({
      data: {
        tenantId,
        ...dados,
      },
    })

    await auditService.log(request.usuario.id, 'CREATE', 'AreaAtuacao', area.id, { tenantId })
    return reply.status(201).send(area)
  },

  async updateAreaAtuacao(request, reply) {
    const { tenantId } = request.usuario
    const { id } = request.params
    const dados = request.body

    const area = await prisma.areaAtuacao.updateMany({
      where: { id, tenantId },
      data: dados,
    })

    return reply.send({ sucesso: true })
  },

  async deleteAreaAtuacao(request, reply) {
    const { tenantId } = request.usuario
    const { id } = request.params

    await prisma.areaAtuacao.updateMany({
      where: { id, tenantId },
      data: { ativa: false },
    })

    await auditService.log(request.usuario.id, 'DELETE', 'AreaAtuacao', id, { tenantId })
    return reply.send({ sucesso: true })
  },

  // ==================== ESPECIALIDADES ====================

  async createEspecialidade(request, reply) {
    const { tenantId } = request.usuario
    const dados = request.body

    const especialidade = await prisma.especialidade.create({
      data: {
        tenantId,
        ...dados,
      },
    })

    await auditService.log(request.usuario.id, 'CREATE', 'Especialidade', especialidade.id, { tenantId })
    return reply.status(201).send(especialidade)
  },

  async updateEspecialidade(request, reply) {
    const { tenantId } = request.usuario
    const { id } = request.params
    const dados = request.body

    await prisma.especialidade.updateMany({
      where: { id, tenantId },
      data: dados,
    })

    return reply.send({ sucesso: true })
  },

  async deleteEspecialidade(request, reply) {
    const { tenantId } = request.usuario
    const { id } = request.params

    await prisma.especialidade.updateMany({
      where: { id, tenantId },
      data: { ativa: false },
    })

    await auditService.log(request.usuario.id, 'DELETE', 'Especialidade', id, { tenantId })
    return reply.send({ sucesso: true })
  },

  // ==================== EQUIPES ====================

  async listEquipes(request, reply) {
    const { tenantId } = request.usuario
    const equipes = await prisma.equipe.findMany({
      where: { tenantId },
      include: {
        membros: true,
      },
      orderBy: { nome: 'asc' },
    })
    return reply.send(equipes)
  },

  async createEquipe(request, reply) {
    const { tenantId } = request.usuario
    const dados = request.body

    const equipe = await prisma.equipe.create({
      data: {
        tenantId,
        ...dados,
      },
    })

    await auditService.log(request.usuario.id, 'CREATE', 'Equipe', equipe.id, { tenantId })
    return reply.status(201).send(equipe)
  },

  async updateEquipe(request, reply) {
    const { tenantId } = request.usuario
    const { id } = request.params
    const dados = request.body

    await prisma.equipe.updateMany({
      where: { id, tenantId },
      data: dados,
    })

    return reply.send({ sucesso: true })
  },

  async deleteEquipe(request, reply) {
    const { tenantId } = request.usuario
    const { id } = request.params

    await prisma.equipe.updateMany({
      where: { id, tenantId },
      data: { ativa: false },
    })

    await auditService.log(request.usuario.id, 'DELETE', 'Equipe', id, { tenantId })
    return reply.send({ sucesso: true })
  },

  // ==================== CENTROS DE CUSTO ====================

  async listCentrosCusto(request, reply) {
    const { tenantId } = request.usuario
    const centros = await prisma.centroCusto.findMany({
      where: { tenantId },
      include: {
        filhos: true,
      },
      orderBy: { codigo: 'asc' },
    })
    return reply.send(centros)
  },

  async createCentroCusto(request, reply) {
    const { tenantId } = request.usuario
    const dados = request.body

    const centro = await prisma.centroCusto.create({
      data: {
        tenantId,
        ...dados,
      },
    })

    await auditService.log(request.usuario.id, 'CREATE', 'CentroCusto', centro.id, { tenantId })
    return reply.status(201).send(centro)
  },

  async updateCentroCusto(request, reply) {
    const { tenantId } = request.usuario
    const { id } = request.params
    const dados = request.body

    await prisma.centroCusto.updateMany({
      where: { id, tenantId },
      data: dados,
    })

    return reply.send({ sucesso: true })
  },

  async deleteCentroCusto(request, reply) {
    const { tenantId } = request.usuario
    const { id } = request.params

    await prisma.centroCusto.updateMany({
      where: { id, tenantId },
      data: { ativo: false },
    })

    await auditService.log(request.usuario.id, 'DELETE', 'CentroCusto', id, { tenantId })
    return reply.send({ sucesso: true })
  },

  // ==================== MODELOS DE CONTRATO ====================

  async listModelosContrato(request, reply) {
    const { tenantId } = request.usuario
    const modelos = await prisma.modeloContrato.findMany({
      where: { tenantId },
      orderBy: { nome: 'asc' },
    })
    return reply.send(modelos)
  },

  async createModeloContrato(request, reply) {
    const { tenantId } = request.usuario
    const dados = request.body

    const modelo = await prisma.modeloContrato.create({
      data: {
        tenantId,
        ...dados,
      },
    })

    await auditService.log(request.usuario.id, 'CREATE', 'ModeloContrato', modelo.id, { tenantId })
    return reply.status(201).send(modelo)
  },

  async updateModeloContrato(request, reply) {
    const { tenantId } = request.usuario
    const { id } = request.params
    const dados = request.body

    await prisma.modeloContrato.updateMany({
      where: { id, tenantId },
      data: dados,
    })

    return reply.send({ sucesso: true })
  },

  async deleteModeloContrato(request, reply) {
    const { tenantId } = request.usuario
    const { id } = request.params

    await prisma.modeloContrato.updateMany({
      where: { id, tenantId },
      data: { ativo: false },
    })

    await auditService.log(request.usuario.id, 'DELETE', 'ModeloContrato', id, { tenantId })
    return reply.send({ sucesso: true })
  },

  // ==================== MODELOS DE TAREFA ====================

  async listModelosTarefa(request, reply) {
    const { tenantId } = request.usuario
    const modelos = await prisma.modeloTarefa.findMany({
      where: { tenantId },
      orderBy: { nome: 'asc' },
    })
    return reply.send(modelos)
  },

  async createModeloTarefa(request, reply) {
    const { tenantId } = request.usuario
    const dados = request.body

    const modelo = await prisma.modeloTarefa.create({
      data: {
        tenantId,
        ...dados,
      },
    })

    await auditService.log(request.usuario.id, 'CREATE', 'ModeloTarefa', modelo.id, { tenantId })
    return reply.status(201).send(modelo)
  },

  async updateModeloTarefa(request, reply) {
    const { tenantId } = request.usuario
    const { id } = request.params
    const dados = request.body

    await prisma.modeloTarefa.updateMany({
      where: { id, tenantId },
      data: dados,
    })

    return reply.send({ sucesso: true })
  },

  async deleteModeloTarefa(request, reply) {
    const { tenantId } = request.usuario
    const { id } = request.params

    await prisma.modeloTarefa.updateMany({
      where: { id, tenantId },
      data: { ativo: false },
    })

    await auditService.log(request.usuario.id, 'DELETE', 'ModeloTarefa', id, { tenantId })
    return reply.send({ sucesso: true })
  },

  // ==================== CONFIGURAÇÕES ====================

  async getConfiguracoes(request, reply) {
    const { tenantId } = request.usuario
    const { categoria } = request.query

    const configs = await escritorioConfigService.getConfiguracoes(tenantId, categoria)
    return reply.send(configs)
  },

  async updateConfiguracao(request, reply) {
    const { tenantId } = request.usuario
    const { categoria, chave } = request.params
    const { valor } = request.body

    const config = await escritorioConfigService.setConfiguracao(
      tenantId,
      categoria,
      chave,
      valor,
      request.usuario.id
    )

    return reply.send(config)
  },

  async updateConfiguracoesBulk(request, reply) {
    const { tenantId } = request.usuario
    const { categoria } = request.params
    const valores = request.body

    const configs = await escritorioConfigService.setConfiguracoes(
      tenantId,
      categoria,
      valores,
      request.usuario.id
    )

    return reply.send(configs)
  },

  async inicializarConfiguracoes(request, reply) {
    const { tenantId } = request.usuario

    const result = await escritorioConfigService.inicializarConfiguracoes(
      tenantId,
      request.usuario.id
    )

    return reply.send(result)
  },
}
