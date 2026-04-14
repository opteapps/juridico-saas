import { prisma } from '../../database/prisma.js'
import { z } from 'zod'

const diligenciaSchema = z.object({
  titulo: z.string().min(1),
  descricao: z.string().optional(),
  local: z.string().optional(),
  data: z.string().optional(),
  processoId: z.string().uuid().optional(),
  responsavelId: z.string().uuid().optional(),
  resultado: z.string().optional(),
  status: z.enum(['pendente', 'em_andamento', 'concluida', 'cancelada']).default('pendente'),
})

export const diligenciaController = {
  async listar(request, reply) {
    const { tenantId, id: usuarioId, role } = request.usuario
    const { status, processoId, responsavelId } = request.query

    const diligencias = await prisma.diligencia.findMany({
      where: {
        tenantId,
        ...(status ? { status } : {}),
        ...(processoId ? { processoId } : {}),
        ...(responsavelId ? { responsavelId } : !['admin_escritorio', 'super_admin'].includes(role) ? { responsavelId: usuarioId } : {}),
      },
      include: {
        responsavel: { select: { id: true, nome: true, avatarUrl: true } },
        processo: { select: { id: true, numero: true, area: true } },
      },
      orderBy: [{ status: 'asc' }, { data: 'asc' }],
    })

    return diligencias
  },

  async criar(request, reply) {
    const { tenantId, id: usuarioId } = request.usuario
    const data = diligenciaSchema.parse(request.body)

    const diligencia = await prisma.diligencia.create({
      data: {
        ...data,
        tenantId,
        responsavelId: data.responsavelId || usuarioId,
        data: data.data ? new Date(data.data) : undefined,
      },
    })

    return reply.status(201).send(diligencia)
  },

  async atualizar(request, reply) {
    const { id } = request.params
    const { tenantId } = request.usuario
    const data = diligenciaSchema.partial().parse(request.body)

    await prisma.diligencia.updateMany({
      where: { id, tenantId },
      data: { ...data, ...(data.data ? { data: new Date(data.data) } : {}) },
    })

    return { message: 'Diligência atualizada' }
  },

  async excluir(request, reply) {
    const { id } = request.params
    const { tenantId } = request.usuario

    await prisma.diligencia.updateMany({ where: { id, tenantId }, data: { status: 'cancelada' } })
    return { message: 'Diligência cancelada' }
  },
}
