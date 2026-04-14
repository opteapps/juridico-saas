import { prisma } from '../../database/prisma.js'
import { z } from 'zod'

const tenantSchema = z.object({
  nome: z.string().min(2),
  cnpj: z.string().optional(),
  email: z.string().email(),
  telefone: z.string().optional(),
  planoId: z.string().uuid(),
  ativo: z.boolean().optional(),
})

export const superAdminController = {
  async metricas(request, reply) {
    const [totalTenants, totalUsuarios, totalProcessos, planosAtivos] = await Promise.all([
      prisma.tenant.count(),
      prisma.usuario.count({ where: { ativo: true } }),
      prisma.processo.count(),
      prisma.assinatura.count({ where: { status: 'ativa' } }),
    ])

    return { totalTenants, totalUsuarios, totalProcessos, planosAtivos }
  },

  async listarTenants(request, reply) {
    const { busca, page = 1, limit = 20 } = request.query

    const where = busca ? {
      OR: [
        { nome: { contains: busca, mode: 'insensitive' } },
        { email: { contains: busca, mode: 'insensitive' } },
        { cnpj: { contains: busca } },
      ],
    } : {}

    const [total, tenants] = await Promise.all([
      prisma.tenant.count({ where }),
      prisma.tenant.findMany({
        where,
        skip: (page - 1) * limit,
        take: Number(limit),
        include: {
          plano: true,
          _count: { select: { usuarios: true, processos: true } },
        },
        orderBy: { criadoEm: 'desc' },
      }),
    ])

    return { tenants, total, page: Number(page) }
  },

  async atualizarTenant(request, reply) {
    const { id } = request.params
    const data = tenantSchema.partial().parse(request.body)

    await prisma.tenant.update({ where: { id }, data })
    return { message: 'Tenant atualizado' }
  },

  async suspenderTenant(request, reply) {
    const { id } = request.params
    const { ativo } = request.body

    await prisma.tenant.update({ where: { id }, data: { ativo } })
    return { message: `Tenant ${ativo ? 'ativado' : 'suspenso'}` }
  },

  async listarPlanos(request, reply) {
    return prisma.plano.findMany({ orderBy: { preco: 'asc' } })
  },

  async criarPlano(request, reply) {
    const plano = await prisma.plano.create({ data: request.body })
    return reply.status(201).send(plano)
  },

  async atualizarPlano(request, reply) {
    const { id } = request.params
    await prisma.plano.update({ where: { id }, data: request.body })
    return { message: 'Plano atualizado' }
  },

  // LGPD - Solicitações de titulares
  async listarSolicitacoesLGPD(request, reply) {
    // Return audit logs related to data access/deletion requests
    const solicitacoes = await prisma.auditLog.findMany({
      where: { acao: { in: ['LGPD_ACESSO', 'LGPD_EXCLUSAO', 'LGPD_PORTABILIDADE'] } },
      orderBy: { criadoEm: 'desc' },
      take: 100,
      include: { tenant: { select: { id: true, nome: true } } },
    })
    return solicitacoes
  },

  // Audit logs do sistema
  async auditoria(request, reply) {
    const { tenantId, acao, page = 1, limit = 50 } = request.query
    
    const where = {
      ...(tenantId ? { tenantId } : {}),
      ...(acao ? { acao } : {}),
    }
    
    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: Number(limit),
        orderBy: { criadoEm: 'desc' },
        include: {
          tenant: { select: { id: true, nome: true } },
          usuario: { select: { id: true, nome: true, email: true } },
        },
      }),
    ])
    
    return { logs, total, page: Number(page) }
  },

  // Cobranças / faturamento
  async listarCobrancas(request, reply) {
    const { status, page = 1, limit = 30 } = request.query
    
    const assinaturas = await prisma.assinatura.findMany({
      where: { ...(status ? { status } : {}) },
      skip: (page - 1) * limit,
      take: Number(limit),
      orderBy: { criadoEm: 'desc' },
      include: {
        tenant: { select: { id: true, nome: true, email: true } },
        plano: { select: { id: true, nome: true, preco: true } },
      },
    })
    
    return assinaturas
  },

  // Suspender/reativar assinatura
  async atualizarAssinatura(request, reply) {
    const { id } = request.params
    const { status } = request.body
    
    await prisma.assinatura.update({ where: { id }, data: { status } })
    
    // If suspending, also suspend the tenant
    const assinatura = await prisma.assinatura.findUnique({ where: { id } })
    if (status === 'cancelada' || status === 'suspensa') {
      await prisma.tenant.update({ where: { id: assinatura.tenantId }, data: { ativo: status !== 'cancelada' } })
    } else if (status === 'ativa') {
      await prisma.tenant.update({ where: { id: assinatura.tenantId }, data: { ativo: true } })
    }
    
    return { message: `Assinatura ${status}` }
  },

  // Estatísticas para dashboard super admin
  async estatisticasSistema(request, reply) {
    const agora = new Date()
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1)
    
    const [
      totalTenants,
      tenantsAtivos,
      totalUsuarios,
      totalProcessos,
      assinaturasAtivas,
      receitaMes,
      novosEscritoriosMes,
    ] = await Promise.all([
      prisma.tenant.count(),
      prisma.tenant.count({ where: { ativo: true } }),
      prisma.usuario.count({ where: { ativo: true, role: { not: 'super_admin' } } }),
      prisma.processo.count(),
      prisma.assinatura.count({ where: { status: 'ativa' } }),
      prisma.assinatura.findMany({
        where: { status: 'ativa' },
        include: { plano: { select: { preco: true } } },
      }).then(ass => ass.reduce((sum, a) => sum + Number(a.plano.preco), 0)),
      prisma.tenant.count({ where: { criadoEm: { gte: inicioMes } } }),
    ])
    
    // Distribuição por plano
    const distribuicaoPlanos = await prisma.assinatura.groupBy({
      by: ['planoId'],
      where: { status: 'ativa' },
      _count: true,
    })
    
    const planosDetalhes = await Promise.all(
      distribuicaoPlanos.map(async (d) => {
        const plano = await prisma.plano.findUnique({ where: { id: d.planoId }, select: { nome: true, preco: true } })
        return { plano: plano?.nome, total: d._count, receita: Number(plano?.preco || 0) * d._count }
      })
    )
    
    return {
      totalTenants,
      tenantsAtivos,
      totalUsuarios,
      totalProcessos,
      assinaturasAtivas,
      receitaMensalRecorrente: receitaMes,
      novosEscritoriosMes,
      distribuicaoPlanos: planosDetalhes,
    }
  },

  // Detalhes de um tenant específico para super admin
  async detalhesTenant(request, reply) {
    const { id } = request.params
    
    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        plano: true,
        assinaturas: { orderBy: { criadoEm: 'desc' }, take: 5 },
        _count: {
          select: {
            usuarios: true,
            processos: true,
            clientes: true,
            documentos: true,
          },
        },
      },
    })
    
    if (!tenant) return reply.status(404).send({ error: 'Escritório não encontrado' })
    
    const ultimosLogins = await prisma.auditLog.findMany({
      where: { tenantId: id, acao: 'LOGIN' },
      orderBy: { criadoEm: 'desc' },
      take: 10,
      include: { usuario: { select: { nome: true, email: true } } },
    })
    
    return { ...tenant, ultimosLogins }
  },
}
