import { schedule } from 'node-cron'
import { tribunalMonitoringService } from '../services/tribunalMonitoringService.js'

/**
 * Sistema de Cron Jobs
 * Executa tarefas agendadas automaticamente
 */
export const cronJobs = {
  /**
   * Inicia todos os cron jobs
   */
  iniciar() {
    console.log('Iniciando cron jobs...')

    // Monitoramento de tribunais - 07:00
    schedule('0 7 * * *', async () => {
      console.log('[CRON] Iniciando monitoramento de tribunais (07:00)')
      try {
        const quantidade = await tribunalMonitoringService.agendarMonitoramentoGeral()
        console.log(`[CRON] ${quantidade} processos agendados para consulta`)
      } catch (error) {
        console.error('[CRON] Erro no monitoramento (07:00):', error.message)
      }
    }, {
      scheduled: true,
      timezone: 'America/Sao_Paulo',
    })

    // Monitoramento de tribunais - 19:00
    schedule('0 19 * * *', async () => {
      console.log('[CRON] Iniciando monitoramento de tribunais (19:00)')
      try {
        const quantidade = await tribunalMonitoringService.agendarMonitoramentoGeral()
        console.log(`[CRON] ${quantidade} processos agendados para consulta`)
      } catch (error) {
        console.error('[CRON] Erro no monitoramento (19:00):', error.message)
      }
    }, {
      scheduled: true,
      timezone: 'America/Sao_Paulo',
    })

    // Verificação de prazos - todos os dias às 06:00
    schedule('0 6 * * *', async () => {
      console.log('[CRON] Verificando prazos do dia')
      try {
        await this.verificarPrazosHoje()
      } catch (error) {
        console.error('[CRON] Erro na verificação de prazos:', error.message)
      }
    }, {
      scheduled: true,
      timezone: 'America/Sao_Paulo',
    })

    // Relatório diário - 08:00
    schedule('0 8 * * *', async () => {
      console.log('[CRON] Gerando relatório diário')
      try {
        await this.gerarRelatorioDiario()
      } catch (error) {
        console.error('[CRON] Erro no relatório diário:', error.message)
      }
    }, {
      scheduled: true,
      timezone: 'America/Sao_Paulo',
    })

    console.log('Cron jobs configurados:')
    console.log('  - Monitoramento tribunais: 07:00 e 19:00')
    console.log('  - Verificação de prazos: 06:00')
    console.log('  - Relatório diário: 08:00')
  },

  /**
   * Verifica prazos do dia
   */
  async verificarPrazosHoje() {
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    const amanha = new Date(hoje)
    amanha.setDate(amanha.getDate() + 1)

    const prazos = await prisma.prazo.findMany({
      where: {
        dataVencimento: {
          gte: hoje,
          lt: amanha,
        },
        status: 'PENDENTE',
      },
      include: {
        usuario: true,
        processo: true,
      },
    })

    console.log(`[CRON] ${prazos.length} prazos vencem hoje`)

    for (const prazo of prazos) {
      // Cria notificação urgente
      await prisma.notificacao.create({
        data: {
          tenantId: prazo.tenantId,
          usuarioId: prazo.usuarioId,
          tipo: 'PRAZO_URGENTE',
          titulo: 'PRAZO VENCE HOJE',
          mensagem: `Processo ${prazo.processo.numero}: ${prazo.descricao}`,
          processoId: prazo.processoId,
          prazoId: prazo.id,
          lida: false,
        },
      })
    }
  },

  /**
   * Gera relatório diário de atividades
   */
  async gerarRelatorioDiario() {
    const ontem = new Date()
    ontem.setDate(ontem.getDate() - 1)
    ontem.setHours(0, 0, 0, 0)

    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    // Conta movimentações do dia
    const movimentacoes = await prisma.movimentacao.count({
      where: {
        createdAt: {
          gte: ontem,
          lt: hoje,
        },
        fonte: 'TRIBUNAL',
      },
    })

    // Conta prazos criados
    const prazos = await prisma.prazo.count({
      where: {
        createdAt: {
          gte: ontem,
          lt: hoje,
        },
      },
    })

    // Conta notificações enviadas
    const notificacoes = await prisma.notificacao.count({
      where: {
        createdAt: {
          gte: ontem,
          lt: hoje,
        },
      },
    })

    console.log('[CRON] Relatório diário:')
    console.log(`  - Movimentações: ${movimentacoes}`)
    console.log(`  - Prazos criados: ${prazos}`)
    console.log(`  - Notificações: ${notificacoes}`)

    // Aqui pode enviar email para administradores
  },

  /**
   * Executa monitoramento manualmente (para testes)
   */
  async executarMonitoramentoManual() {
    console.log('[MANUAL] Iniciando monitoramento de tribunais')
    const quantidade = await tribunalMonitoringService.agendarMonitoramentoGeral()
    console.log(`[MANUAL] ${quantidade} processos agendados`)
    return quantidade
  },
}
