const { z } = require('zod')
const prisma = require('../../database/prisma')

const processoSchema = z.object({
  numero: z.string().min(20).optional(),
  tribunal: z.string().optional().nullable(),
  vara: z.string().optional().nullable(),
  forum: z.string().optional().nullable(),
  juiz: z.string().optional().nullable(),
  area: z.string().optional().nullable(),
  assunto: z.string().optional().nullable(),
  valorCausa: z.number().optional().nullable(),
  descricao: z.string().optional().nullable(),
  observacoes: z.string().optional().nullable(),
  status: z.enum(['ativo', 'suspenso', 'encerrado', 'arquivado']).optional(),
  monitoramentoAtivo: z.boolean().optional(),
  clienteIds: z.array(z.string()).optional(),
  advogadoIds: z.array(z.string()).optional(),
})

function formatarNumeroCNJ(numero) {
  const n = String(numero || '').replace(/\D/g, '')
  if (n.length !== 20) return numero
  return `${n.slice(0, 7)}-${n.slice(7, 9)}.${n.slice(9, 13)}.${n.slice(13, 14)}.${n.slice(14, 16)}.${n.slice(16)}`
}

module.exports = {
  async listar(request) {
    const { tenantId } = request.usuario
    const { busca = '', limit = 20, page = 1 } = request.query
    const skip = (Number(page) - 1) * Number(limit)

    const where = {
      tenantId,
      ...(busca ? {
        OR: [
          { numero: { contains: busca } },
          { numeroFormatado: { contains: busca } },
          { assunto: { contains: busca, mode: 'insensitive' } },
        ],
      } : {}),
    }

    const [processos, total] = await Promise.all([
      prisma.processo.findMany({
        where,
        include: {
          clientes: { include: { cliente: true } },
          advogados: { include: { usuario: true } },
        },
        orderBy: { criadoEm: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.processo.count({ where }),
    ])

    return { processos, total }
  },

  async obter(request, reply) {
    const { id } = request.params
    const { tenantId } = request.usuario

    const processo = await prisma.processo.findFirst({
      where: { id, tenantId },
      include: {
        clientes: { include: { cliente: true } },
        advogados: { include: { usuario: true } },
        movimentacoes: { orderBy: { data: 'desc' }, take: 10 },
        prazos: { orderBy: { dataVencimento: 'asc' } },
        _count: { select: { movimentacoes: true, documentos: true } },
      },
    })

    if (!processo) {
      return reply.code(404).send({ error: 'Processo não encontrado' })
    }

    return processo
  },

  async criar(request, reply) {
    const { tenantId, id: usuarioId } = request.usuario
    const data = processoSchema.parse(request.body)
    const { clienteIds = [], advogadoIds = [], ...processoData } = data

    const processo = await prisma.$transaction(async (tx) => {
      const criado = await tx.processo.create({
        data: {
          ...processoData,
          tenantId,
          numeroFormatado: processoData.numero ? formatarNumeroCNJ(processoData.numero) : null,
        },
      })

      if (clienteIds.length > 0) {
        await tx.clienteProcesso.createMany({
          data: clienteIds.map((clienteId) => ({ clienteId, processoId: criado.id })),
        })
      }

      if (advogadoIds.length > 0) {
        await tx.advogadoProcesso.createMany({
          data: advogadoIds.map((advogadoId, index) => ({
            usuarioId: advogadoId,
            processoId: criado.id,
            principal: index === 0,
          })),
        })
      }

      await tx.auditLog.create({
        data: { tenantId, usuarioId, acao: 'CREATE', entidade: 'Processo', entidadeId: criado.id },
      })

      return criado
    })

    return reply.code(201).send(processo)
  },

  async atualizar(request) {
    const { id } = request.params
    const { tenantId, id: usuarioId } = request.usuario
    const data = processoSchema.partial().parse(request.body)
    const { clienteIds, advogadoIds, ...processoData } = data

    await prisma.$transaction(async (tx) => {
      await tx.processo.updateMany({
        where: { id, tenantId },
        data: {
          ...processoData,
          ...(processoData.numero ? { numeroFormatado: formatarNumeroCNJ(processoData.numero) } : {}),
        },
      })

      if (clienteIds) {
        await tx.clienteProcesso.deleteMany({ where: { processoId: id } })
        if (clienteIds.length > 0) {
          await tx.clienteProcesso.createMany({
            data: clienteIds.map((clienteId) => ({ clienteId, processoId: id })),
          })
        }
      }

      if (advogadoIds) {
        await tx.advogadoProcesso.deleteMany({ where: { processoId: id } })
        if (advogadoIds.length > 0) {
          await tx.advogadoProcesso.createMany({
            data: advogadoIds.map((advogadoId, index) => ({
              usuarioId: advogadoId,
              processoId: id,
              principal: index === 0,
            })),
          })
        }
      }

      await tx.auditLog.create({
        data: { tenantId, usuarioId, acao: 'UPDATE', entidade: 'Processo', entidadeId: id },
      })
    })

    return { message: 'Processo atualizado' }
  },

  async excluir(request, reply) {
    const { id } = request.params
    const { tenantId } = request.usuario

    await prisma.processo.deleteMany({ where: { id, tenantId } })
    return reply.code(204).send()
  },
}