/**
 * Motor de cálculo de prazos processuais
 * Implementa regras do CPC e CLT
 */

// Feriados judiciais nacionais (exemplo - deve ser atualizado anualmente)
const FERIADOS_JUDICIAIS_2024 = [
  '2024-01-01', // Confraternização Universal
  '2024-02-12', // Carnaval
  '2024-02-13', // Carnaval
  '2024-03-29', // Sexta-feira Santa
  '2024-04-21', // Tiradentes
  '2024-05-01', // Dia do Trabalho
  '2024-05-30', // Corpus Christi
  '2024-09-07', // Independência
  '2024-10-12', // Nossa Senhora Aparecida
  '2024-11-02', // Finados
  '2024-11-15', // Proclamação da República
  '2024-11-20', // Consciência Negra
  '2024-12-24', // Véspera de Natal (recesso)
  '2024-12-25', // Natal
  '2024-12-31', // Véspera de Ano Novo (recesso)
]

// Recesso forense (normalmente de 20 de dezembro a 6 de janeiro)
const RECESSO_FORENSE = {
  inicio: '12-20',
  fim: '01-06',
}

export const deadlineEngine = {
  /**
   * Processa uma movimentação e identifica/calcula prazos
   */
  async processarMovimentacao(data) {
    const { movimentacaoId, processoId, tenantId, descricao, tipo, data: dataMov } = data

    console.log(`Analisando prazo para movimentação ${movimentacaoId}...`)

    // Identifica tipo de prazo baseado na descrição
    const tipoPrazo = this.identificarTipoPrazo(descricao, tipo)

    if (!tipoPrazo) {
      console.log('Nenhum prazo identificado')
      return null
    }

    // Calcula prazo
    const prazoCalculado = this.calcularPrazo(
      new Date(dataMov),
      tipoPrazo.dias,
      tipoPrazo.tipoDias
    )

    // Busca responsáveis pelo processo
    const processo = await prisma.processo.findFirst({
      where: { id: processoId },
      include: { responsaveis: true },
    })

    // Cria prazo para cada responsável
    const prazosCriados = []
    for (const responsavel of processo?.responsaveis || []) {
      const prazo = await prisma.prazo.create({
        data: {
          tenantId,
          processoId,
          usuarioId: responsavel.usuarioId,
          descricao: tipoPrazo.descricao,
          dataInicio: new Date(dataMov),
          dataVencimento: prazoCalculado.dataFinal,
          diasUteis: tipoPrazo.dias,
          tipo: tipoPrazo.codigo,
          status: 'PENDENTE',
          fonte: 'AUTOMATICO',
        },
      })

      prazosCriados.push(prazo)

      // Agenda alertas
      await this.agendarAlertas(prazo.id, prazoCalculado.dataFinal, tenantId)
    }

    console.log(`${prazosCriados.length} prazos criados`)
    return prazosCriados
  },

  /**
   * Identifica o tipo de prazo baseado na movimentação
   */
  identificarTipoPrazo(descricao, tipoMovimentacao) {
    const desc = descricao?.toLowerCase() || ''

    // Prazos processuais comuns
    const prazos = [
      {
        codigo: 'CONTESTACAO',
        descricao: 'Prazo para Contestação',
        dias: 15,
        tipoDias: 'UTEIS',
        padroes: ['contestação', 'prazo para contestar', 'intimado a contestar'],
      },
      {
        codigo: 'RECURSO',
        descricao: 'Prazo para Interposição de Recurso',
        dias: 15,
        tipoDias: 'UTEIS',
        padroes: ['recurso', 'prazo para recorrer', 'intimado a recorrer'],
      },
      {
        codigo: 'MANIFESTACAO',
        descricao: 'Prazo para Manifestação',
        dias: 15,
        tipoDias: 'UTEIS',
        padroes: ['manifeste-se', 'manifestação', 'intimado a se manifestar'],
      },
      {
        codigo: 'ESCLARECIMENTO',
        descricao: 'Prazo para Esclarecimento',
        dias: 15,
        tipoDias: 'UTEIS',
        padroes: ['esclarecimento', 'esclareça', 'intimado a esclarecer'],
      },
      {
        codigo: 'COMPROVANTE',
        descricao: 'Prazo para Comprovante',
        dias: 5,
        tipoDias: 'UTEIS',
        padroes: ['comprovante', 'comprovar', 'intimado a comprovar'],
      },
      {
        codigo: 'AUDIENCIA',
        descricao: 'Audiência Designada',
        dias: 0,
        tipoDias: 'CORRIDOS',
        padroes: ['audiência', 'sessão de conciliação', 'instrução e julgamento'],
      },
      {
        codigo: 'PERICIA',
        descricao: 'Prazo para Perícia',
        dias: 30,
        tipoDias: 'UTEIS',
        padroes: ['perícia', 'nomeação de perito', 'intimado a apresentar quesitos'],
      },
      {
        codigo: 'JUNTADA',
        descricao: 'Prazo para Juntada de Documentos',
        dias: 10,
        tipoDias: 'UTEIS',
        padroes: ['junte', 'juntada', 'intimado a juntar'],
      },
      {
        codigo: 'PAGAMENTO',
        descricao: 'Prazo para Pagamento',
        dias: 15,
        tipoDias: 'UTEIS',
        padroes: ['pagamento', 'depósito', 'intimado a pagar'],
      },
      {
        codigo: 'CUMPRIMENTO',
        descricao: 'Prazo para Cumprimento',
        dias: 15,
        tipoDias: 'UTEIS',
        padroes: ['cumpra-se', 'intimado a cumprir', 'prazo para cumprimento'],
      },
    ]

    for (const prazo of prazos) {
      if (prazo.padroes.some(p => desc.includes(p))) {
        return prazo
      }
    }

    // Se for decisão/despacho e não identificou prazo específico
    if (tipoMovimentacao === 'DECISAO' || tipoMovimentacao === 'DESPACHO') {
      return {
        codigo: 'MANIFESTACAO',
        descricao: 'Prazo para Manifestação',
        dias: 15,
        tipoDias: 'UTEIS',
        padroes: [],
      }
    }

    return null
  },

  /**
   * Calcula prazo considerando dias úteis e feriados
   */
  calcularPrazo(dataInicio, dias, tipoDias = 'UTEIS') {
    let dataAtual = new Date(dataInicio)
    let diasContados = 0

    if (tipoDias === 'CORRIDOS') {
      dataAtual.setDate(dataAtual.getDate() + dias)
      return {
        dataFinal: dataAtual,
        diasUteis: this.contarDiasUteis(dataInicio, dataAtual),
      }
    }

    // Dias úteis
    while (diasContados < dias) {
      dataAtual.setDate(dataAtual.getDate() + 1)
      
      if (this.isDiaUtil(dataAtual)) {
        diasContados++
      }
    }

    return {
      dataFinal: dataAtual,
      diasUteis: diasContados,
    }
  },

  /**
   * Verifica se é dia útil
   */
  isDiaUtil(data) {
    const diaSemana = data.getDay()
    
    // Fim de semana
    if (diaSemana === 0 || diaSemana === 6) {
      return false
    }

    // Feriado
    const dataStr = data.toISOString().split('T')[0]
    if (FERIADOS_JUDICIAIS_2024.includes(dataStr)) {
      return false
    }

    // Recesso forense
    const mesDia = data.toISOString().slice(5, 10)
    if (mesDia >= RECESSO_FORENSE.inicio || mesDia <= RECESSO_FORENSE.fim) {
      return false
    }

    return true
  },

  /**
   * Conta dias úteis entre duas datas
   */
  contarDiasUteis(dataInicio, dataFim) {
    let count = 0
    let atual = new Date(dataInicio)
    const fim = new Date(dataFim)

    while (atual < fim) {
      atual.setDate(atual.getDate() + 1)
      if (this.isDiaUtil(atual)) {
        count++
      }
    }

    return count
  },

  /**
   * Agenda alertas para um prazo
   */
  async agendarAlertas(prazoId, dataVencimento, tenantId) {
    const hoje = new Date()
    const vencimento = new Date(dataVencimento)
    const diffDias = Math.ceil((vencimento - hoje) / (1000 * 60 * 60 * 24))

    const alertas = []

    if (diffDias >= 7) {
      alertas.push({ tipo: '7_DIAS', delay: (diffDias - 7) * 24 * 60 * 60 * 1000 })
    }
    if (diffDias >= 3) {
      alertas.push({ tipo: '3_DIAS', delay: (diffDias - 3) * 24 * 60 * 60 * 1000 })
    }
    if (diffDias >= 1) {
      alertas.push({ tipo: '1_DIA', delay: (diffDias - 1) * 24 * 60 * 60 * 1000 })
    }
    alertas.push({ tipo: 'HOJE', delay: diffDias > 0 ? diffDias * 24 * 60 * 60 * 1000 : 0 })

    for (const alerta of alertas) {
      await notificationQueue.add(
        'alerta-prazo',
        { prazoId, tipoAlerta: alerta.tipo, tenantId },
        { delay: alerta.delay, attempts: 3 }
      )
    }

    console.log(`${alertas.length} alertas agendados para prazo ${prazoId}`)
  },

  /**
   * Recalcula prazo em caso de suspensão (feriado, recesso)
   */
  async recalcularPrazoSuspensao(prazoId) {
    const prazo = await prisma.prazo.findUnique({ where: { id: prazoId } })
    
    if (!prazo || prazo.status !== 'PENDENTE') {
      return null
    }

    const novoPrazo = this.calcularPrazo(
      prazo.dataInicio,
      prazo.diasUteis,
      'UTEIS'
    )

    await prisma.prazo.update({
      where: { id: prazoId },
      data: { dataVencimento: novoPrazo.dataFinal },
    })

    return novoPrazo
  },
}
