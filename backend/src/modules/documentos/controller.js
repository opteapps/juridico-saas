import { prisma } from '../../database/prisma.js'
import { uploadFile, getSignedUrl, deleteFile } from '../../integrations/storage/minio.js'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'

export const documentoController = {
  async listar(request, reply) {
    const { tenantId } = request.usuario
    const { processoId, clienteId, tipo, page = 1, limit = 20 } = request.query

    const documentos = await prisma.documento.findMany({
      where: {
        tenantId,
        ...(processoId ? { processoId } : {}),
        ...(clienteId ? { clienteId } : {}),
        ...(tipo ? { tipo } : {}),
      },
      skip: (page - 1) * limit,
      take: Number(limit),
      orderBy: { criadoEm: 'desc' },
      include: {
        usuario: { select: { id: true, nome: true } },
        processo: { select: { id: true, numero: true } },
        cliente: { select: { id: true, nome: true } },
      },
    })

    return documentos
  },

  async upload(request, reply) {
    const { tenantId, id: usuarioId } = request.usuario
    const parts = request.parts()

    let file, processoId, clienteId, tipo, descricao, publico

    for await (const part of parts) {
      if (part.type === 'file') {
        file = part
      } else {
        if (part.fieldname === 'processoId') processoId = part.value
        if (part.fieldname === 'clienteId') clienteId = part.value
        if (part.fieldname === 'tipo') tipo = part.value
        if (part.fieldname === 'descricao') descricao = part.value
        if (part.fieldname === 'publico') publico = part.value === 'true'
      }
    }

    if (!file) return reply.status(400).send({ error: 'Arquivo obrigatório' })

    const ext = path.extname(file.filename)
    const storageKey = `${tenantId}/${processoId || clienteId || 'geral'}/${uuidv4()}${ext}`

    const buffer = await file.toBuffer()

    try {
      await uploadFile(storageKey, buffer, file.mimetype)
    } catch (e) {
      console.warn('MinIO upload failed, storing metadata only:', e.message)
    }

    const documento = await prisma.documento.create({
      data: {
        tenantId,
        usuarioId,
        processoId: processoId || null,
        clienteId: clienteId || null,
        nome: file.filename,
        tipo,
        mimetype: file.mimetype,
        tamanhoBytes: buffer.length,
        storageKey,
        descricao,
        publico: publico || false,
      },
    })

    return reply.status(201).send(documento)
  },

  async download(request, reply) {
    const { id } = request.params
    const { tenantId } = request.usuario

    const doc = await prisma.documento.findFirst({ where: { id, tenantId } })
    if (!doc) return reply.status(404).send({ error: 'Documento não encontrado' })

    try {
      const url = await getSignedUrl(doc.storageKey)
      return { url, nome: doc.nome }
    } catch {
      return reply.status(503).send({ error: 'Serviço de armazenamento indisponível' })
    }
  },

  async excluir(request, reply) {
    const { id } = request.params
    const { tenantId } = request.usuario

    const doc = await prisma.documento.findFirst({ where: { id, tenantId } })
    if (!doc) return reply.status(404).send({ error: 'Documento não encontrado' })

    try { await deleteFile(doc.storageKey) } catch {}

    await prisma.documento.delete({ where: { id } })
    return { message: 'Documento excluído' }
  },
}
