import { prisma } from '../database/prisma.js'
import { buscarMovimentacoesDataJud } from '../integrations/tribunais/datajud.js'
import { notificacaoQueue } from './index.js'

export async function processoMonitoramentoJob(job) {
  const { processoId, numero, tipo } = job.data
  
  if (tipo === 'todos') {
    // Monitor all active processes
    const processos = await prisma.processo.findMany({
      where: { monitoramentoAtivo: true, status: 'ativo' },
      select: { id: true, numero: true, tenantId: true, tribunal: true },
      take: 100,
    })
    
    for (const p of processos) {
      await verificarMovimentacoes(p)
    }
    return
  }
  
  if (processoId) {
    const processo = await prisma.processo.findUnique({
      where: { id: processoId },
      select: { id: true, numero: true, tenantId: true, tribunal: true },
    })
    if (processo) await verificarMovimentacoes(processo)
  }
}

async function verificarMovimentacoes(processo) {
  try {
    const movimentacoesRemota = await buscarMovimentacoesDataJud(processo.numero, processo.tribunal)
    if (!movimentacoesRemota.length) return
    
    const ultimaLocal = await prisma.movimentacao.findFirst({
      where: { processoId: processo.id },
      orderBy: { data: 'desc' },
    })
    
    const dataLimite = ultimaLocal?.data || new Date(0)
    const novas = movimentacoesRemota.filter(m => new Date(m.data) > dataLimite)
    
    if (!novas.length) return
    
    for (const mov of novas) {
      await prisma.movimentacao.create({
        data: {
          processoId: processo.id,
          data: new Date(mov.data),
          tipo: mov.tipo,
          descricao: mov.descricao,
          origem: 'datajud',
          dadosOriginais: mov,
        },
      })
      
      // Notify lawyers assigned to this process
      const advogados = await prisma.advogadoProcesso.findMany({
        where: { processoId: processo.id },
        select: { usuarioId: true },
      })
      
      for (const adv of advogados) {
        await notificacaoQueue.add('notificar', {
          usuarioId: adv.usuarioId,
          tenantId: processo.tenantId,
          tipo: 'movimentacao',
          titulo: 'Nova movimentação processual',
          mensagem: mov.descricao?.slice(0, 200),
          link: `/processos/${processo.id}`,
        })
      }
    }
    
    await prisma.processo.update({
      where: { id: processo.id },
      data: { ultimaConsulta: new Date() },
    })
  } catch (err) {
    console.error(`Error monitoring process ${processo.numero}:`, err.message)
  }
}
