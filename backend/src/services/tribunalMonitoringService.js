import { Queue, Worker } from 'bullmq'
import { tribunalIntegrationService } from '../modules/tribunais/service.js'
import { prisma } from '../database/prisma.js'
import { deadlineEngine } from './deadlineEngine.js'

// Conexão Redis
const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
}

// Filas
export const tribunalQueue = new Queue('tribunal-monitoring', { connection })
export const deadlineQueue = new Queue('deadline-processing', { connection })
export const notificationQueue = new Queue('notifications', { connection })

/**
 * Serviço de monitoramento de tribunais
 * Responsável por orquestrar consultas automáticas
 */
export const tribunalMonitoringService = {
  /**
   * Agenda monitoramento de todos os processos ativos
   */
  async agendarMonitoramentoGeral() {
    const processos = await prisma.processo.findMany({
      where: {
        status: { in: ['ATIVO', 'EM_ANDAMENTO'] },
        monitorarTribunal: true,
      },
      select: {
        id: true,
        numero: true,
        tenantId: true,
        ultimaAtualizacao: true,
      },
    })

    console.log(`Agendando monitoramento de ${processos.length} processos`)

    for (const processo of processos) {
      await tribunalQueue.add(
        'consultar-processo',
        {
          processoId: processo.id,
          numero: processo.numero,
          tenantId: processo.tenantId,
        },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
        }
      )
    }

    return processos.length
  },

  /**
   * Processa um processo específico
   */
  async processarProcesso(data) {
    const { processoId, numero, tenantId } = data

    console.log(`Processando ${numero}...`)

    try {
      // Consulta no tribunal
      const resultados = await tribunalIntegrationService.consultarTodosTribunais(numero)

      if (resultados.length === 0) {
        console.log(`Processo ${numero} não encontrado nos tribunais`)
        return
      }

      const dados = resultados[0].dados

      // Busca movimentações existentes
      const movimentacoesExistentes = await prisma.movimentacao.findMany({
        where: { processoId },
        select: { data: true, descricao: true },
      })

      // Identifica novas movimentações
      const novasMovimentacoes = []
      for (const mov of dados.movimentacoes || []) {
        const dataMov = new Date(mov.data)
        const jaExiste = movimentacoesExistentes.some(
          ex => ex.data.getTime() === dataMov.getTime() && 
               ex.descricao === mov.descricao
        )

        if (!jaExiste) {
          novasMovimentacoes.push(mov)
        }
      }

      if (novasMovimentacoes.length === 0) {
        console.log(`Processo ${numero}: sem novas movimentações`)
        return
      }

      console.log(`Processo ${numero}: ${novasMovimentacoes.length} novas movimentações`)

      // Salva novas movimentações
      for (const mov of novasMovimentacoes) {
        const movimentacao = await prisma.movimentacao.create({
          data: {
            processoId,
            tenantId,
            data: new Date(mov.data),
            descricao: mov.descricao,
            tipo: mov.tipo,
            fonte: 'TRIBUNAL',
          },
        })

        // Agenda processamento de prazo
        await deadlineQueue.add(
          'processar-prazo',
          {
            movimentacaoId: movimentacao.id,
            processoId,
            tenantId,
            descricao: mov.descricao,
            tipo: mov.tipo,
            data: mov.data,
          },
          { attempts: 3 }
        )

        // Agenda notificação
        await notificationQueue.add(
          'notificar-movimentacao',
          {
            processoId,
            tenantId,
            movimentacaoId: movimentacao.id,
            descricao: mov.descricao,
          },
          { attempts: 3 }
        )
      }

      // Atualiza última atualização do processo
      await prisma.processo.update({
        where: { id: processoId },
        data: { ultimaAtualizacao: new Date() },
      })

    } catch (error) {
      console.error(`Erro ao processar ${numero}:`, error.message)
      throw error
    }
  },
}

/**
 * Worker para processar fila de tribunais
 */
export const tribunalWorker = new Worker(
  'tribunal-monitoring',
  async (job) => {
    if (job.name === 'consultar-processo') {
      await tribunalMonitoringService.processarProcesso(job.data)
    }
  },
  { connection, concurrency: 5 }
)

/**
 * Worker para processar prazos
 */
export const deadlineWorker = new Worker(
  'deadline-processing',
  async (job) => {
    if (job.name === 'processar-prazo') {
      await deadlineEngine.processarMovimentacao(job.data)
    }
  },
  { connection, concurrency: 3 }
)

/**
 * Worker para notificações
 */
export const notificationWorker = new Worker(
  'notifications',
  async (job) => {
    if (job.name === 'notificar-movimentacao') {
      await enviarNotificacaoMovimentacao(job.data)
    }
    if (job.name === 'alerta-prazo') {
      await enviarAlertaPrazo(job.data)
    }
  },
  { connection, concurrency: 10 }
)

/**
 * Envia notificação de nova movimentação
 */
async function enviarNotificacaoMovimentacao(data) {
  const { processoId, tenantId, descricao } = data

  // Busca advogados responsáveis
  const processo = await prisma.processo.findFirst({
    where: { id: processoId },
    include: {
      responsaveis: { include: { usuario: true } },
    },
  })

  if (!processo) return

  for (const resp of processo.responsaveis) {
    // Cria notificação no sistema
    await prisma.notificacao.create({
      data: {
        tenantId,
        usuarioId: resp.usuarioId,
        tipo: 'MOVIMENTACAO',
        titulo: 'Nova movimentação processual',
        mensagem: `Processo ${processo.numero}: ${descricao}`,
        processoId,
        lida: false,
      },
    })

    // Aqui pode enviar email/push notification
    console.log(`Notificação enviada para ${resp.usuario.email}`)
  }
}

/**
 * Envia alerta de prazo
 */
async function enviarAlertaPrazo(data) {
  const { prazoId, tipoAlerta } = data

  const prazo = await prisma.prazo.findFirst({
    where: { id: prazoId },
    include: {
      processo: true,
      usuario: true,
    },
  })

  if (!prazo) return

  const mensagens = {
    '7_DIAS': `Prazo em 7 dias: ${prazo.descricao}`,
    '3_DIAS': `Prazo em 3 dias: ${prazo.descricao}`,
    '1_DIA': `Prazo amanhã: ${prazo.descricao}`,
    'HOJE': `PRAZO VENCE HOJE: ${prazo.descricao}`,
  }

  await prisma.notificacao.create({
    data: {
      tenantId: prazo.tenantId,
      usuarioId: prazo.usuarioId,
      tipo: 'PRAZO',
      titulo: 'Alerta de prazo processual',
      mensagem: mensagens[tipoAlerta],
      processoId: prazo.processoId,
      prazoId: prazo.id,
      lida: false,
    },
  })

  console.log(`Alerta ${tipoAlerta} enviado para ${prazo.usuario.email}`)
}
