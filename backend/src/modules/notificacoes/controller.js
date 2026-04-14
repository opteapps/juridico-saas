import { prisma } from '../../database/prisma.js'

export const notificacaoController = {
  async listar(request, reply) {
    const { id: usuarioId, tenantId } = request.usuario
    const { lida, page = 1, limit = 20 } = request.query

    const where = {
      usuarioId,
      tenantId,
      ...(lida !== undefined ? { lida: lida === 'true' } : {}),
    }

    const [total, notificacoes] = await Promise.all([
      prisma.notificacao.count({ where }),
      prisma.notificacao.findMany({
        where,
        skip: (page - 1) * limit,
        take: Number(limit),
        orderBy: { criadoEm: 'desc' },
      }),
    ])

    const naoLidas = await prisma.notificacao.count({ where: { usuarioId, tenantId, lida: false } })

    return { notificacoes, total, naoLidas, page: Number(page) }
  },

  async marcarLida(request, reply) {
    const { id } = request.params
    const { id: usuarioId } = request.usuario

    await prisma.notificacao.updateMany({ where: { id, usuarioId }, data: { lida: true } })
    return { message: 'Notificação marcada como lida' }
  },

  async marcarTodasLidas(request, reply) {
    const { id: usuarioId, tenantId } = request.usuario

    await prisma.notificacao.updateMany({ where: { usuarioId, tenantId, lida: false }, data: { lida: true } })
    return { message: 'Todas as notificações marcadas como lidas' }
  },
}
