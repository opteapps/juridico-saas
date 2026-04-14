import { prisma } from '../../database/prisma.js'
import { z } from 'zod'

const clienteSchema = z.object({
  tipo: z.enum(['pessoa_fisica', 'pessoa_juridica']).default('pessoa_fisica'),
  nome: z.string().min(2),
  cpfCnpj: z.string().optional(),
  email: z.string().email().optional(),
  telefone: z.string().optional(),
  celular: z.string().optional(),
  endereco: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  cep: z.string().optional(),
  dataNascimento: z.string().optional(),
  profissao: z.string().optional(),
  observacoes: z.string().optional(),
  areas: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
})

function parseArrayFields(obj) {
  if (!obj) return obj
  const result = { ...obj }
  if (typeof result.areasAtuacao === 'string') result.areasAtuacao = JSON.parse(result.areasAtuacao || '[]')
  if (typeof result.areas === 'string') result.areas = JSON.parse(result.areas || '[]')
  if (typeof result.tags === 'string') result.tags = JSON.parse(result.tags || '[]')
  return result
}

export const clienteController = {
  async listar(request, reply) {
    const { tenantId } = request.usuario
    const { busca, area, page = 1, limit = 20 } = request.query
    
    const where = {
      tenantId,
      ativo: true,
      ...(busca ? {
        OR: [
          { nome: { contains: busca, mode: 'insensitive' } },
          { cpfCnpj: { contains: busca } },
          { email: { contains: busca, mode: 'insensitive' } },
        ],
      } : {}),
      ...(area ? { areas: { contains: area } } : {}),
    }
    
    const [total, clientes] = await Promise.all([
      prisma.cliente.count({ where }),
      prisma.cliente.findMany({
        where,
        skip: (page - 1) * limit,
        take: Number(limit),
        orderBy: { nome: 'asc' },
        include: {
          _count: { select: { processos: true } },
        },
      }),
    ])
    
    return { clientes: clientes.map(parseArrayFields), total, page: Number(page), pages: Math.ceil(total / limit) }
  },

  async buscar(request, reply) {
    const { id } = request.params
    const { tenantId } = request.usuario
    
    const cliente = await prisma.cliente.findFirst({
      where: { id, tenantId, ativo: true },
      include: {
        processos: {
          include: { processo: { select: { id: true, numero: true, area: true, status: true, tribunal: true } } },
        },
      },
    })
    
    if (!cliente) return reply.status(404).send({ error: 'Cliente não encontrado' })
    return parseArrayFields(cliente)
  },

  async criar(request, reply) {
    const { tenantId } = request.usuario
    const data = clienteSchema.parse(request.body)
    
    const cliente = await prisma.cliente.create({
      data: {
        ...data,
        tenantId,
        dataNascimento: data.dataNascimento ? new Date(data.dataNascimento) : undefined,
        areas: JSON.stringify(data.areas || []),
        tags: JSON.stringify(data.tags || []),
      },
    })
    
    return reply.status(201).send(parseArrayFields(cliente))
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
    
    await prisma.cliente.updateMany({ where: { id, tenantId }, data: { ativo: false } })
    return { message: 'Cliente removido' }
  },

  async processos(request, reply) {
    const { id } = request.params
    const { tenantId } = request.usuario
    
    const processos = await prisma.clienteProcesso.findMany({
      where: { clienteId: id, cliente: { tenantId } },
      include: { processo: true },
    })
    
    return processos.map(cp => cp.processo)
  },

  async financeiro(request, reply) {
    const { id } = request.params
    const { tenantId } = request.usuario
    
    const lancamentos = await prisma.lancamento.findMany({
      where: { clienteId: id, tenantId },
      orderBy: { criadoEm: 'desc' },
    })
    
    const totalReceber = lancamentos.filter(l => l.tipo === 'receita' && l.status === 'pendente').reduce((a, b) => a + Number(b.valor), 0)
    const totalRecebido = lancamentos.filter(l => l.tipo === 'receita' && l.status === 'pago').reduce((a, b) => a + Number(b.valor), 0)
    
    return { lancamentos, totalReceber, totalRecebido }
  },

  async buscarProcessosTribunal(request, reply) {
    const { id } = request.params
    const { tenantId } = request.usuario
    
    const cliente = await prisma.cliente.findFirst({ where: { id, tenantId } })
    if (!cliente || !cliente.cpfCnpj) {
      return reply.status(400).send({ error: 'Cliente sem CPF/CNPJ cadastrado' })
    }
    
    // TODO: integrate with DataJud API
    return { message: 'Busca nos tribunais iniciada', cpfCnpj: cliente.cpfCnpj }
  },
}
