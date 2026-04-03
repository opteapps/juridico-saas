import { prisma } from '../../database/prisma.js'
import { z } from 'zod'

const lancamentoSchema = z.object({
  tipo: z.enum(['receita', 'despesa']),
  categoria: z.string(),
  descricao: z.string().min(1),
  valor: z.number().positive(),
  dataVencimento: z.string().optional(),
  dataPagamento: z.string().optional(),
  status: z.enum(['pendente', 'pago', 'cancelado', 'vencido']).default('pendente'),
  formaPagamento: z.string().optional(),
  processoId: z.string().uuid().optional(),
  clienteId: z.string().uuid().optional(),
  usuarioId: z.string().uuid().optional(),
  observacoes: z.string().optional(),
})

export const financeiroController = {
  async listar(request, reply) {
    const { tenantId } = request.usuario
    const { tipo, status, clienteId, processoId, page = 1, limit = 30, dataInicio, dataFim } = request.query

    const where = {
      tenantId,
      ...(tipo ? { tipo } : {}),
      ...(status ? { status } : {}),
      ...(clienteId ? { clienteId } : {}),
      ...(processoId ? { processoId } : {}),
      ...(dataInicio && dataFim ? {
        criadoEm: { gte: new Date(dataInicio), lte: new Date(dataFim) },
      } : {}),
    }

    const [total, lancamentos] = await Promise.all([
      prisma.lancamento.count({ where }),
      prisma.lancamento.findMany({
        where,
        skip: (page - 1) * limit,
        take: Number(limit),
        orderBy: { criadoEm: 'desc' },
        include: {
          cliente: { select: { id: true, nome: true } },
          processo: { select: { id: true, numero: true } },
          usuario: { select: { id: true, nome: true } },
        },
      }),
    ])

    return { lancamentos, total, page: Number(page) }
  },

  async resumo(request, reply) {
    const { tenantId } = request.usuario
    const { mes, ano } = request.query

    const agora = new Date()
    const m = mes ? Number(mes) - 1 : agora.getMonth()
    const y = ano ? Number(ano) : agora.getFullYear()
    const inicio = new Date(y, m, 1)
    const fim = new Date(y, m + 1, 0, 23, 59, 59)

    const lancamentos = await prisma.lancamento.findMany({
      where: { tenantId, criadoEm: { gte: inicio, lte: fim } },
    })

    const totalReceitas = lancamentos.filter(l => l.tipo === 'receita' && l.status === 'pago').reduce((a, b) => a + Number(b.valor), 0)
    const totalDespesas = lancamentos.filter(l => l.tipo === 'despesa' && l.status === 'pago').reduce((a, b) => a + Number(b.valor), 0)
    const aReceber = lancamentos.filter(l => l.tipo === 'receita' && l.status === 'pendente').reduce((a, b) => a + Number(b.valor), 0)
    const aPagar = lancamentos.filter(l => l.tipo === 'despesa' && l.status === 'pendente').reduce((a, b) => a + Number(b.valor), 0)

    return {
      totalReceitas,
      totalDespesas,
      saldo: totalReceitas - totalDespesas,
      aReceber,
      aPagar,
      periodo: { inicio, fim },
    }
  },

  async criar(request, reply) {
    const { tenantId, id: usuarioId } = request.usuario
    const data = lancamentoSchema.parse(request.body)

    const lancamento = await prisma.lancamento.create({
      data: {
        ...data,
        tenantId,
        usuarioId: data.usuarioId || usuarioId,
        valor: data.valor,
        dataVencimento: data.dataVencimento ? new Date(data.dataVencimento) : undefined,
        dataPagamento: data.dataPagamento ? new Date(data.dataPagamento) : undefined,
      },
    })

    return reply.status(201).send(lancamento)
  },

  async atualizar(request, reply) {
    const { id } = request.params
    const { tenantId } = request.usuario
    const data = lancamentoSchema.partial().parse(request.body)

    await prisma.lancamento.updateMany({
      where: { id, tenantId },
      data: {
        ...data,
        ...(data.dataVencimento ? { dataVencimento: new Date(data.dataVencimento) } : {}),
        ...(data.dataPagamento ? { dataPagamento: new Date(data.dataPagamento) } : {}),
      },
    })

    return { message: 'Lançamento atualizado' }
  },

  async excluir(request, reply) {
    const { id } = request.params
    const { tenantId } = request.usuario

    await prisma.lancamento.updateMany({ where: { id, tenantId }, data: { status: 'cancelado' } })
    return { message: 'Lançamento cancelado' }
  },

  async marcarPago(request, reply) {
    const { id } = request.params
    const { tenantId } = request.usuario

    await prisma.lancamento.updateMany({
      where: { id, tenantId },
      data: { status: 'pago', dataPagamento: new Date() },
    })

    return { message: 'Marcado como pago' }
  },

  async comissoes(request, reply) {
    const { tenantId } = request.usuario
    const { mes, ano } = request.query

    const agora = new Date()
    const m = mes ? Number(mes) - 1 : agora.getMonth()
    const y = ano ? Number(ano) : agora.getFullYear()
    const inicio = new Date(y, m, 1)
    const fim = new Date(y, m + 1, 0, 23, 59, 59)

    const comissoes = await prisma.lancamento.groupBy({
      by: ['usuarioId'],
      where: { tenantId, categoria: 'comissao', criadoEm: { gte: inicio, lte: fim } },
      _sum: { valor: true },
    })

    const detalhes = await Promise.all(comissoes.map(async (c) => {
      const usuario = await prisma.usuario.findUnique({
        where: { id: c.usuarioId },
        select: { id: true, nome: true },
      })
      return { usuario, total: Number(c._sum.valor) }
    }))

    return detalhes
  },
}
