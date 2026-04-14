import { tribunalIntegrationService } from './service.js'

export const tribunaisController = {
  /**
   * Consulta processo em tribunais
   */
  async consultarProcesso(request, reply) {
    const { numero } = request.params
    const { tribunal } = request.query

    try {
      let resultado

      if (tribunal) {
        // Consulta tribunal específico
        switch (tribunal.toLowerCase()) {
          case 'datajud':
            resultado = await tribunalIntegrationService.consultarDataJud(numero)
            break
          case 'stf':
            resultado = await tribunalIntegrationService.consultarSTF(numero)
            break
          case 'stj':
            resultado = await tribunalIntegrationService.consultarSTJ(numero)
            break
          default:
            return reply.status(400).send({ error: 'Tribunal não suportado' })
        }
      } else {
        // Consulta todos os tribunais
        const resultados = await tribunalIntegrationService.consultarTodosTribunais(numero)
        resultado = resultados[0]?.dados || null
      }

      if (!resultado) {
        return reply.status(404).send({ error: 'Processo não encontrado' })
      }

      return reply.send({
        sucesso: true,
        processo: resultado,
      })
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({ error: error.message })
    }
  },

  /**
   * Busca movimentações de um processo
   */
  async buscarMovimentacoes(request, reply) {
    const { numero } = request.params
    const { tribunal } = request.query

    try {
      const movimentacoes = await tribunalIntegrationService.buscarMovimentacoes(
        numero,
        tribunal || 'datajud'
      )

      return reply.send({
        sucesso: true,
        quantidade: movimentacoes.length,
        movimentacoes,
      })
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({ error: error.message })
    }
  },

  /**
   * Sincroniza processo do tribunal com o sistema
   */
  async sincronizarProcesso(request, reply) {
    const { processoId } = request.params
    const { tenantId } = request.user

    try {
      // Busca processo no banco
      const processo = await prisma.processo.findFirst({
        where: { id: processoId, tenantId },
      })

      if (!processo) {
        return reply.status(404).send({ error: 'Processo não encontrado' })
      }

      // Consulta no tribunal
      const dadosTribunal = await tribunalIntegrationService.consultarTodosTribunais(
        processo.numero
      )

      if (dadosTribunal.length === 0) {
        return reply.status(404).send({ error: 'Processo não encontrado nos tribunais' })
      }

      const dados = dadosTribunal[0].dados

      // Atualiza processo
      await prisma.processo.update({
        where: { id: processoId },
        data: {
          assunto: dados.assuntos?.join(', ') || processo.assunto,
          dataDistribuicao: dados.dataAjuizamento || processo.dataDistribuicao,
          vara: dados.orgaoJulgador || processo.vara,
          ultimaAtualizacao: new Date(),
        },
      })

      // Insere movimentações novas
      const movimentacoesExistentes = await prisma.movimentacao.findMany({
        where: { processoId },
        select: { data: true, descricao: true },
      })

      const novasMovimentacoes = dados.movimentacoes?.filter(mov => {
        return !movimentacoesExistentes.some(
          ex => ex.data === new Date(mov.data) && ex.descricao === mov.descricao
        )
      }) || []

      for (const mov of novasMovimentacoes) {
        await prisma.movimentacao.create({
          data: {
            processoId,
            tenantId,
            data: new Date(mov.data),
            descricao: mov.descricao,
            tipo: mov.tipo,
            fonte: 'TRIBUNAL',
          },
        })
      }

      return reply.send({
        sucesso: true,
        mensagem: `Processo sincronizado. ${novasMovimentacoes.length} novas movimentações.`,
        novasMovimentacoes: novasMovimentacoes.length,
      })
    } catch (error) {
      request.log.error(error)
      return reply.status(500).send({ error: error.message })
    }
  },

  /**
   * Lista tribunais disponíveis
   */
  async listarTribunais(request, reply) {
    return reply.send({
      tribunais: [
        { codigo: 'datajud', nome: 'DataJud (CNJ)', descricao: 'Base nacional de processos' },
        { codigo: 'stf', nome: 'Supremo Tribunal Federal', descricao: 'Tribunal constitucional' },
        { codigo: 'stj', nome: 'Superior Tribunal de Justiça', descricao: 'Tribunal de uniformização' },
      ],
    })
  },
}
