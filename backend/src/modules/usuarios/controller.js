import bcrypt from 'bcryptjs'
import { prisma } from '../../database/prisma.js'
import { z } from 'zod'

const usuarioSchema = z.object({
  nome: z.string().min(2),
  email: z.string().email(),
  senha: z.string().min(8).optional(),
  role: z.enum(['admin_escritorio', 'advogado', 'estagiario', 'financeiro', 'secretaria']).optional(),
  oab: z.string().optional(),
  telefone: z.string().optional(),
  areasAtuacao: z.array(z.string()).default([]),
})

function parseArrayFields(obj) {
  if (!obj) return obj
  const result = { ...obj }
  if (typeof result.areasAtuacao === 'string') result.areasAtuacao = JSON.parse(result.areasAtuacao || '[]')
  if (typeof result.areas === 'string') result.areas = JSON.parse(result.areas || '[]')
  if (typeof result.tags === 'string') result.tags = JSON.parse(result.tags || '[]')
  return result
}

export const usuarioController = {
  async listar(request, reply) {
    const { tenantId } = request.usuario
    const { busca, role } = request.query

    const usuarios = await prisma.usuario.findMany({
      where: {
        tenantId,
        ativo: true,
        ...(role ? { role } : {}),
        ...(busca ? {
          OR: [
            { nome: { contains: busca, mode: 'insensitive' } },
            { email: { contains: busca, mode: 'insensitive' } },
            { oab: { contains: busca } },
          ],
        } : {}),
      },
      select: {
        id: true, nome: true, email: true, role: true, oab: true,
        telefone: true, avatarUrl: true, areasAtuacao: true, criadoEm: true,
        _count: { select: { processosAdv: true } },
      },
      orderBy: { nome: 'asc' },
    })

    return usuarios.map(parseArrayFields)
  },

  async buscar(request, reply) {
    const { id } = request.params
    const { tenantId } = request.usuario

    const usuario = await prisma.usuario.findFirst({
      where: { id, tenantId, ativo: true },
      select: {
        id: true, nome: true, email: true, role: true, oab: true,
        telefone: true, avatarUrl: true, areasAtuacao: true, criadoEm: true,
        processosAdv: {
          include: { processo: { select: { id: true, numero: true, area: true, status: true } } },
          take: 10,
        },
      },
    })

    if (!usuario) return reply.status(404).send({ error: 'Usuário não encontrado' })
    return parseArrayFields(usuario)
  },

  async criar(request, reply) {
    const { tenantId } = request.usuario
    const data = usuarioSchema.parse(request.body)

    const existente = await prisma.usuario.findFirst({
      where: { email: data.email.toLowerCase(), tenantId },
    })
    if (existente) return reply.status(409).send({ error: 'Email já cadastrado no escritório' })

    const senha = await bcrypt.hash(data.senha || 'Mudar@123', 12)

    const usuario = await prisma.usuario.create({
      data: { ...data, email: data.email.toLowerCase(), senha, tenantId, areasAtuacao: JSON.stringify(data.areasAtuacao || []) },
      select: { id: true, nome: true, email: true, role: true, oab: true, areasAtuacao: true },
    })

    return reply.status(201).send(parseArrayFields(usuario))
  },

  async atualizar(request, reply) {
    const { id } = request.params
    const { tenantId } = request.usuario
    const data = usuarioSchema.partial().parse(request.body)

    if (data.senha) {
      data.senha = await bcrypt.hash(data.senha, 12)
    }
    if (data.areasAtuacao !== undefined) {
      data.areasAtuacao = JSON.stringify(data.areasAtuacao || [])
    }

    await prisma.usuario.updateMany({ where: { id, tenantId }, data })
    return { message: 'Usuário atualizado' }
  },

  async excluir(request, reply) {
    const { id } = request.params
    const { tenantId, id: meId } = request.usuario

    if (id === meId) return reply.status(400).send({ error: 'Não é possível excluir seu próprio usuário' })

    await prisma.usuario.updateMany({ where: { id, tenantId }, data: { ativo: false } })
    return { message: 'Usuário removido' }
  },

  async meuPerfil(request, reply) {
    const usuario = await prisma.usuario.findUnique({
      where: { id: request.usuario.id },
      select: {
        id: true, nome: true, email: true, role: true, oab: true,
        telefone: true, avatarUrl: true, areasAtuacao: true,
      },
    })
    return parseArrayFields(usuario)
  },

  async atualizarPerfil(request, reply) {
    const { nome, oab, telefone, areasAtuacao } = request.body

    await prisma.usuario.update({
      where: { id: request.usuario.id },
      data: { nome, oab, telefone, areasAtuacao: JSON.stringify(areasAtuacao || []) },
    })

    return { message: 'Perfil atualizado' }
  },
}
