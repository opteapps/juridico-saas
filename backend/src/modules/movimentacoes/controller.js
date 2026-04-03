import { prisma } from '../../database/prisma.js'
import { z } from 'zod'

const movimentacaoSchema = z.object({
  processoId: z.string().uuid(),
  data: z.string(),
  tipo: z.string().optional(),
  descricao: z.string().min(1),
  urgencia: z.enum(['baixa', 'normal', 'alta', 'critica']).default('normal'),
})

export const movimentacaoController = {
  async listar(request, reply) {
    const { tenantId } = request.usuario
    const { processoId, tipo, urgencia, page = 1, limit = 30 } = request.query

    const where = {
      processo: { tenantId },
      ...(processoId ? { processoId } : {}),
      ...(tipo ? { tipo } : {}),
      ...(urgencia ? { urgencia } : {}),
    }

    const [total, movimentacoes] = await Promise.all([
      prisma.movimentacao.count({ where }),
      prisma.movimentacao.findMany({
        where,
        skip: (page - 1) * limit,
        take: Number(limit),
        orderBy: { data: 'desc' },
        include: { processo: { select: { id: true, numero: true, area: true } } },
      }),
    ])

    return { movimentacoes, total, page: Number(page) }
  },

  async criar(request, reply) {
    const { tenantId } = request.usuario
    const data = movimentacaoSchema.parse(request.body)

    const processo = await prisma.processo.findFirst({
      where: { id: data.processoId, tenantId },
    })
    if (!processo) return reply.status(404).send({ error: 'Processo não encontrado' })

    const movimentacao = await prisma.movimentacao.create({
      data: { ...data, data: new Date(data.data), origem: 'manual' },
    })

    return reply.status(201).send(movimentacao)
  },

  async marcarLida(request, reply) {
    const { id } = request.params
    await prisma.movimentacao.update({ where: { id }, data: { lida: true } })
    return { message: 'Movimentação marcada como lida' }
  },

  async marcarTodasLidas(request, reply) {
    const { processoId } = request.body
    const { tenantId } = request.usuario

    await prisma.movimentacao.updateMany({
      where: { processoId, processo: { tenantId }, lida: false },
      data: { lida: true },
    })

    return { message: 'Movimentações marcadas como lidas' }
  },
}
