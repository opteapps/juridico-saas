import { prisma } from '../../database/prisma.js'
import { z } from 'zod'
import { consultarDataJud } from '../../integrations/tribunais/datajud.js'

const processoSchema = z.object({
  numero: z.string().min(20),
  tribunal: z.string().optional(),
  vara: z.string().optional(),
  forum: z.string().optional(),
  juiz: z.string().optional(),
  area: z.string().optional(),
  assunto: z.string().optional(),
  valorCausa: z.number().optional(),
  status: z.enum(['ativo', 'suspenso', 'encerrado', 'arquivado']).default('ativo'),
  descricao: z.string().optional(),
  observacoes: z.string().optional(),
  dadosAdicionais: z.any().optional(),
  clienteIds: z.array(z.string().uuid()).optional(),
  advogadoIds: z.array(z.string().uuid()).optional(),
  monitoramentoAtivo: z.boolean().default(true),
})

export const processoController = {
  async listar(request, reply) {
    const { tenantId } = request.usuario
    const { busca, status, area, advogadoId, clienteId, page = 1, limit = 20 } = request.query
    
    const where = {
      tenantId,
      ...(status ? { status } : {}),
      ...(area ? { area } : {}),
      ...(busca ? {
        OR: [
          { numero: { contains: busca } },
          { assunto: { contains: busca, mode: 'insensitive' } },
          { vara: { contains: busca, mode: 'insensitive' } },
          { juiz: { contains: busca, mode: 'insensitive' } },
        ],
      } : {}),
      ...(advogadoId ? { advogados: { some: { usuarioId: advogadoId } } } : {}),
      ...(clienteId ? { clientes: { some: { clienteId } } } : {}),
    }
    
    const [total, processos] = await Promise.all([
      prisma.processo.count({ where }),
      prisma.processo.findMany({
        where,
        skip: (page - 1) * limit,
        take: Number(limit),
        orderBy: { atualizadoEm: 'desc' },
        include: {
          clientes: { include: { cliente: { select: { id: true, nome: true } } } },
          advogados: { include: { usuario: { select: { id: true, nome: true } } } },
          _count: { select: { movimentacoes: true, prazos: true } },
        },
      }),
    ])
    
    return { processos, total, page: Number(page), pages: Math.ceil(total / limit) }
  },

  async buscar(request, reply) {
    const { id } = request.params
    const { tenantId } = request.usuario
    
    const processo = await prisma.processo.findFirst({
      where: { id, tenantId },
      include: {
        clientes: { include: { cliente: true } },
        advogados: { include: { usuario: { select: { id: true, nome: true, oab: true, avatarUrl: true } } } },
        movimentacoes: { orderBy: { data: 'desc' }, take: 5 },
        prazos: { where: { status: 'pendente' }, orderBy: { dataVencimento: 'asc' } },
        diligencias: { where: { status: { not: 'concluida' } } },
        _count: { select: { movimentacoes: true, documentos: true } },
      },
    })
    
    if (!processo) return reply.status(404).send({ error: 'Processo não encontrado' })
    return processo
  },

  async criar(request, reply) {
    const { tenantId, id: usuarioId } = request.usuario
    const data = processoSchema.parse(request.body)
    const { clienteIds, advogadoIds, ...processoData } = data
    
    const processo = await prisma.$transaction(async (tx) => {
      const p = await tx.processo.create({
        data: {
          ...processoData,
          tenantId,
          numeroFormatado: formatarNumeroCNJ(processoData.numero),
          clientes: clienteIds ? {
            create: clienteIds.map(clienteId => ({ clienteId })),
          } : undefined,
          advogados: {
            create: [
              { usuarioId, principal: true },
              ...(advogadoIds?.filter(id => id !== usuarioId).map(id => ({ usuarioId: id })) || []),
            ],
          },
        },
      })
      
      await tx.auditLog.create({
        data: { tenantId, usuarioId, acao: 'CREATE', entidade: 'Processo', entidadeId: p.id },
      })
      
      return p
    })
    
    // Trigger monitoring job
    if (processo.monitoramentoAtivo) {
      try {
        const { processoMonitoramentoQueue } = await import('../../jobs/index.js')
        await processoMonitoramentoQueue.add('consultar', { processoId: processo.id, numero: processo.numero }, { priority: 1 })
      } catch (e) {
        console.warn('Could not queue monitoring job:', e.message)
      }
    }
    
    return reply.status(201).send(processo)
  },

  async atualizar(request, reply) {
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
    
    await prisma.processo.updateMany({ where: { id, tenantId }, data: { status: 'arquivado' } })
    return { message: 'Processo arquivado' }
  },

  async movimentacoes(request, reply) {
    const { id } = request.params
    const { tenantId } = request.usuario
    const { page = 1, limit = 30 } = request.query
    
    const where = { processoId: id, processo: { tenantId } }
    
    const [total, movimentacoes] = await Promise.all([
      prisma.movimentacao.count({ where }),
      prisma.movimentacao.findMany({
        where,
        skip: (page - 1) * limit,
        take: Number(limit),
        orderBy: { data: 'desc' },
      }),
    ])
    
    return { movimentacoes, total, page: Number(page) }
  },

  async prazos(request, reply) {
    const { id } = request.params
    const { tenantId } = request.usuario
    
    const prazos = await prisma.prazo.findMany({
      where: { processoId: id, processo: { tenantId } },
      orderBy: { dataVencimento: 'asc' },
    })
    
    return prazos
  },

  async ativarMonitoramento(request, reply) {
    const { id } = request.params
    const { tenantId } = request.usuario
    const { ativo } = request.body
    
    await prisma.processo.updateMany({
      where: { id, tenantId },
      data: { monitoramentoAtivo: ativo },
    })
    
    return { message: `Monitoramento ${ativo ? 'ativado' : 'desativado'}` }
  },

  async buscarPorNumero(request, reply) {
    const { numero } = request.body
    const { tenantId } = request.usuario
    
    // Search locally first
    const local = await prisma.processo.findFirst({ where: { numero, tenantId } })
    if (local) return { encontrado: true, fonte: 'local', processo: local }
    
    // Search DataJud
    try {
      const resultado = await consultarDataJud(numero)
      return { encontrado: !!resultado, fonte: 'datajud', dados: resultado }
    } catch (e) {
      return { encontrado: false, erro: 'Erro ao consultar tribunal' }
    }
  },
}

function formatarNumeroCNJ(numero) {
  const n = numero.replace(/\D/g, '')
  if (n.length !== 20) return numero
  return `${n.slice(0,7)}-${n.slice(7,9)}.${n.slice(9,13)}.${n.slice(13,14)}.${n.slice(14,16)}.${n.slice(16)}`
}
