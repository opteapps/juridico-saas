const { z } = require('zod')
const prisma = require('../../database/prisma')

const clienteSchema = z.object({
  tipo: z.enum(['pessoa_fisica', 'pessoa_juridica']).optional(),
  nome: z.string().min(2),
  cpfCnpj: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  telefone: z.string().optional().nullable(),
  celular: z.string().optional().nullable(),
  profissao: z.string().optional().nullable(),
  endereco: z.string().optional().nullable(),
  cidade: z.string().optional().nullable(),
  estado: z.string().optional().nullable(),
  cep: z.string().optional().nullable(),
  observacoes: z.string().optional().nullable(),
  areas: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  dataNascimento: z.coerce.date().optional().nullable(),
})

module.exports = {
  async listar(request) {
    const { tenantId } = request.usuario
    const { busca = '', page = 1, limit = 20 } = request.query
    const skip = (Number(page) - 1) * Number(limit)

    const where = {
      tenantId,
      ...(busca ? {
        OR: [
          { nome: { contains: busca, mode: 'insensitive' } },
          { email: { contains: busca, mode: 'insensitive' } },
          { cpfCnpj: { contains: busca } },
        ],
      } : {}),
    }

    const [clientes, total] = await Promise.all([
      prisma.cliente.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { criadoEm: 'desc' },
      }),
      prisma.cliente.count({ where }),
    ])

    return { clientes, total }
  },

  async obter(request, reply) {
    const { id } = request.params
    const { tenantId } = request.usuario

    const cliente = await prisma.cliente.findFirst({
      where: { id, tenantId },
      include: {
        processos: {
          include: {
            processo: true,
          },
        },
      },
    })

    if (!cliente) {
      return reply.code(404).send({ error: 'Cliente não encontrado' })
    }

    return cliente
  },

  async criar(request, reply) {
    const { tenantId } = request.usuario
    const data = clienteSchema.parse(request.body)

    const cliente = await prisma.cliente.create({
      data: {
        ...data,
        tenantId,
        areas: JSON.stringify(data.areas || []),
        tags: JSON.stringify(data.tags || []),
      },
    })

    return reply.code(201).send(cliente)
  },

  async atualizar(request, reply) {
    const { id } = request.params
    const { tenantId } = request.usuario
    const data = clienteSchema.partial().parse(request.body)

    if (data.areas !== undefined) data.areas = JSON.stringify(data.areas || [])
    if (data.tags !== undefined) data.tags = JSON.stringify(data.tags || [])
    if (data.dataNascimento !== undefined) {
      data.dataNascimento = data.dataNascimento ? new Date(data.dataNascimento) : null
    }

    await prisma.cliente.updateMany({
      where: { id, tenantId },
      data,
    })

    return { message: 'Cliente atualizado' }
  },

  async excluir(request, reply) {
    const { id } = request.params
    const { tenantId } = request.usuario

    await prisma.cliente.deleteMany({
      where: { id, tenantId },
    })

    return reply.code(204).send()
  },
}