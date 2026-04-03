import { prisma } from '../database/prisma.js'

export async function notificacaoJob(job) {
  const { usuarioId, tenantId, tipo, titulo, mensagem, link } = job.data
  
  await prisma.notificacao.create({
    data: { usuarioId, tenantId, tipo, titulo, mensagem, link },
  })
  
  // TODO: Send push notification via FCM
  // TODO: Send email if configured
}
