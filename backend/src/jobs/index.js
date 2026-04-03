// Jobs com suporte a modo sem Redis (REDIS_DISABLED=true)

let processoMonitoramentoQueue = null
let notificacaoQueue = null

// Fila simples em memória para quando Redis não está disponível
class MemoryQueue {
  constructor(name) {
    this.name = name
    this.jobs = []
  }
  async add(name, data, opts) {
    this.jobs.push({ id: Date.now().toString(), name, data })
    return { id: Date.now().toString() }
  }
}

export function getProcessoMonitoramentoQueue() {
  return processoMonitoramentoQueue
}

export function getNotificacaoQueue() {
  return notificacaoQueue
}

export async function startJobs() {
  if (process.env.REDIS_DISABLED === 'true') {
    processoMonitoramentoQueue = new MemoryQueue('processo-monitoramento')
    notificacaoQueue = new MemoryQueue('notificacoes')
    console.log('Jobs: modo sem Redis (monitoramento automático desabilitado para testes)')
    return
  }

  try {
    const { Queue, Worker } = await import('bullmq')
    const { processoMonitoramentoJob } = await import('./processoMonitoramento.js')
    const { notificacaoJob } = await import('./notificacao.js')

    const connection = {
      host: process.env.REDIS_HOST || 'localhost',
      port: 6379,
      password: process.env.REDIS_PASSWORD || undefined,
    }

    processoMonitoramentoQueue = new Queue('processo-monitoramento', { connection })
    notificacaoQueue = new Queue('notificacoes', { connection })

    const monitoramentoWorker = new Worker('processo-monitoramento', processoMonitoramentoJob, { connection, concurrency: 5 })
    const notificacaoWorker = new Worker('notificacoes', notificacaoJob, { connection, concurrency: 10 })

    monitoramentoWorker.on('completed', job => console.log(`Job ${job.id} completed`))
    monitoramentoWorker.on('failed', (job, err) => console.error(`Job ${job?.id} failed:`, err))

    await processoMonitoramentoQueue.add(
      'monitoramento-geral',
      { tipo: 'todos' },
      { repeat: { every: 30 * 60 * 1000 }, jobId: 'monitoramento-periodico' }
    )

    console.log('Jobs iniciados com Redis')
  } catch (err) {
    console.warn('Redis indisponível, usando modo sem fila:', err.message)
    processoMonitoramentoQueue = new MemoryQueue('processo-monitoramento')
    notificacaoQueue = new MemoryQueue('notificacoes')
  }
}

// Export proxies para compatibilidade
export { processoMonitoramentoQueue, notificacaoQueue }
