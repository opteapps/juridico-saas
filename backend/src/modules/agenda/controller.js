import { prisma } from '../../database/prisma.js'
import { z } from 'zod'

const eventoSchema = z.object({
  titulo: z.string().min(1),
  descricao: z.string().optional(),
  tipo: z.enum(['audiencia', 'prazo', 'diligencia', 'reuniao', 'compromisso']).default('compromisso'),
  inicio: z.string(),
  fim: z.string().optional(),
  diaInteiro: z.boolean().default(false),
  local: z.string().optional(),
  processoId: z.string().uuid().optional(),
  usuarioId: z.string().uuid().optional(),
  lembretes: z.any().optional(),
})

export const agendaController = {
  async listar(request, reply) {
    const { tenantId, id: usuarioId, role } = request.usuario
    const { inicio, fim, advogadoId, tipo } = request.query

    const targetUsuarioId = advogadoId || (role === 'admin_escritorio' ? undefined : usuarioId)

    const eventos = await prisma.agendaEvento.findMany({
      where: {
        tenantId,
        ...(targetUsuarioId ? { usuarioId: targetUsuarioId } : {}),
        ...(tipo ? { tipo } : {}),
        ...(inicio && fim ? {
          inicio: { gte: new Date(inicio) },
          fim: { lte: new Date(fim) },
        } : {}),
      },
      include: {
        usuario: { select: { id: true, nome: true, avatarUrl: true } },
        processo: { select: { id: true, numero: true, area: true } },
      },
      orderBy: { inicio: 'asc' },
    })

    return eventos
  },

  async criar(request, reply) {
    const { tenantId, id: usuarioId } = request.usuario
    const data = eventoSchema.parse(request.body)

    const evento = await prisma.agendaEvento.create({
      data: {
        ...data,
        tenantId,
        usuarioId: data.usuarioId || usuarioId,
        inicio: new Date(data.inicio),
        fim: data.fim ? new Date(data.fim) : undefined,
      },
    })

    return reply.status(201).send(evento)
  },

  async atualizar(request, reply) {
    const { id } = request.params
    const { tenantId } = request.usuario
    const data = eventoSchema.partial().parse(request.body)

    await prisma.agendaEvento.updateMany({
      where: { id, tenantId },
      data: {
        ...data,
        ...(data.inicio ? { inicio: new Date(data.inicio) } : {}),
        ...(data.fim ? { fim: new Date(data.fim) } : {}),
      },
    })

    return { message: 'Evento atualizado' }
  },

  async excluir(request, reply) {
    const { id } = request.params
    const { tenantId } = request.usuario

    await prisma.agendaEvento.deleteMany({ where: { id, tenantId } })
    return { message: 'Evento removido' }
  },

  async prazosProximos(request, reply) {
    const { tenantId } = request.usuario
    const dias = Number(request.query.dias) || 7
    const dataLimite = new Date()
    dataLimite.setDate(dataLimite.getDate() + dias)

    const prazos = await prisma.prazo.findMany({
      where: {
        processo: { tenantId },
        status: 'pendente',
        dataVencimento: { lte: dataLimite, gte: new Date() },
      },
      include: {
        processo: { select: { id: true, numero: true, area: true } },
      },
      orderBy: { dataVencimento: 'asc' },
    })

    return prazos
  },
}
