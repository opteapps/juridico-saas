import { prisma } from '../../database/prisma.js'

export const tenantController = {
  async meuTenant(request, reply) {
    const { tenantId } = request.usuario

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        plano: true,
        _count: { select: { usuarios: true, processos: true, clientes: true } },
      },
    })

    if (!tenant) return reply.status(404).send({ error: 'Escritório não encontrado' })
    return tenant
  },

  async atualizar(request, reply) {
    const { tenantId } = request.usuario
    const { nome, telefone, endereco, logoUrl } = request.body

    await prisma.tenant.update({
      where: { id: tenantId },
      data: { nome, telefone, endereco, logoUrl },
    })

    return { message: 'Escritório atualizado' }
  },
}
