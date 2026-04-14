import { GoogleGenerativeAI } from '@google/generative-ai'
import { prisma } from '../../database/prisma.js'
import { legalAI } from '../../services/legalAI.js'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

const AVISO_IA = '\n\n---\n⚠️ **Aviso importante**: Esta resposta foi gerada por IA como apoio informativo. A IA não substitui o advogado e não assume responsabilidade jurídica. Toda decisão requer validação do profissional responsável.'

const SYSTEM_PROMPT = `Você é um assistente jurídico especializado no direito brasileiro. 
Você auxilia advogados com informações sobre leis, jurisprudência, prazos processuais e procedimentos jurídicos.
IMPORTANTE: Você é uma ferramenta de apoio. Nunca tome decisões jurídicas, não substitua o advogado e sempre recomende validação profissional.
Responda em português brasileiro, de forma clara e objetiva.`

export const iaController = {
  async chat(request, reply) {
    const { mensagem, contexto } = request.body
    
    if (!process.env.GEMINI_API_KEY) {
      return reply.status(503).send({ error: 'Serviço de IA não configurado' })
    }
    
    try {
      const resposta = await legalAI.chat(mensagem, contexto)
      return { resposta: resposta + AVISO_IA }
    } catch (err) {
      console.error('IA error:', err)
      return reply.status(500).send({ error: 'Erro ao processar com IA' })
    }
  },

  async resumirProcesso(request, reply) {
    const { id } = request.params
    const { tenantId } = request.usuario
    
    const processo = await prisma.processo.findFirst({
      where: { id, tenantId },
      include: {
        movimentacoes: { orderBy: { data: 'desc' }, take: 10 },
        clientes: { include: { cliente: { select: { nome: true } } } },
      },
    })
    
    if (!processo) return reply.status(404).send({ error: 'Processo não encontrado' })
    
    if (!process.env.GEMINI_API_KEY) {
      return { resumo: 'Serviço de IA não configurado' }
    }
    
    try {
      const resumo = await legalAI.resumirProcesso(processo, processo.movimentacoes)
      return { resumo: resumo + AVISO_IA }
    } catch (err) {
      return { resumo: 'Erro ao gerar resumo com IA' }
    }
  },

  async classificarMovimentacao(request, reply) {
    const { descricao } = request.body
    
    if (!process.env.GEMINI_API_KEY) {
      return { tipo: 'outros', urgencia: 'normal' }
    }
    
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
      const prompt = `Classifique esta movimentação processual em JSON:
      Movimentação: "${descricao}"
      
      Responda APENAS com JSON válido:
      {
        "tipo": "decisao|despacho|intimacao|audiencia|prazo|sentenca|acordao|outros",
        "urgencia": "critica|alta|normal|baixa",
        "temPrazo": true|false,
        "diasPrazo": number|null
      }`
      
      const result = await model.generateContent(prompt)
      const texto = result.response.text().replace(/```json\n?|\n?```/g, '').trim()
      return JSON.parse(texto)
    } catch {
      return { tipo: 'outros', urgencia: 'normal', temPrazo: false, diasPrazo: null }
    }
  },

  async sugerirPrazos(request, reply) {
    const { movimentacao } = request.body
    
    if (!process.env.GEMINI_API_KEY) {
      return { prazos: [] }
    }
    
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
      const prompt = `${SYSTEM_PROMPT}
      
      Com base nesta movimentação processual, sugira os prazos legais aplicáveis:
      "${movimentacao}"
      
      Responda em JSON:
      {
        "prazos": [
          { "tipo": "string", "dias": number, "descricao": "string", "base_legal": "string" }
        ]
      }`
      
      const result = await model.generateContent(prompt)
      const texto = result.response.text().replace(/```json\n?|\n?```/g, '').trim()
      return JSON.parse(texto)
    } catch {
      return { prazos: [] }
    }
  },

  /**
   * Explicar decisão judicial
   */
  async explicarDecisao(request, reply) {
    const { textoDecisao, processoId } = request.body
    const { tenantId } = request.usuario

    if (!process.env.GEMINI_API_KEY) {
      return reply.status(503).send({ error: 'Serviço de IA não configurado' })
    }

    try {
      let contexto = ''
      if (processoId) {
        const processo = await prisma.processo.findFirst({
          where: { id: processoId, tenantId },
        })
        if (processo) {
          contexto = `Processo ${processo.numero}, ${processo.assunto}`
        }
      }

      const explicacao = await legalAI.explicarDecisao(textoDecisao, contexto)
      return { explicacao: explicacao + AVISO_IA }
    } catch (err) {
      console.error('Erro ao explicar decisão:', err)
      return reply.status(500).send({ error: 'Erro ao analisar decisão' })
    }
  },

  /**
   * Sugerir estratégia jurídica
   */
  async sugerirEstrategia(request, reply) {
    const { processoId, objetivo } = request.body
    const { tenantId } = request.usuario

    if (!process.env.GEMINI_API_KEY) {
      return reply.status(503).send({ error: 'Serviço de IA não configurado' })
    }

    try {
      const processo = await prisma.processo.findFirst({
        where: { id: processoId, tenantId },
        include: {
          movimentacoes: { orderBy: { data: 'desc' }, take: 10 },
        },
      })

      if (!processo) {
        return reply.status(404).send({ error: 'Processo não encontrado' })
      }

      const historico = processo.movimentacoes.map(m => m.descricao)
      const estrategia = await legalAI.sugerirEstrategia(processo, historico, objetivo)

      return { estrategia: estrategia + AVISO_IA }
    } catch (err) {
      console.error('Erro ao sugerir estratégia:', err)
      return reply.status(500).send({ error: 'Erro ao gerar sugestões' })
    }
  },

  /**
   * Gerar rascunho de petição
   */
  async gerarPeticao(request, reply) {
    const { tipoPeticao, processoId, argumentos } = request.body
    const { tenantId } = request.usuario

    if (!process.env.GEMINI_API_KEY) {
      return reply.status(503).send({ error: 'Serviço de IA não configurado' })
    }

    try {
      const processo = await prisma.processo.findFirst({
        where: { id: processoId, tenantId },
        include: {
          clientes: { include: { cliente: true } },
        },
      })

      if (!processo) {
        return reply.status(404).send({ error: 'Processo não encontrado' })
      }

      const dadosProcesso = {
        numero: processo.numero,
        vara: processo.vara,
        tribunal: processo.tribunal,
        clientes: processo.clientes.map(c => c.cliente.nome),
      }

      const peticao = await legalAI.gerarPeticao(tipoPeticao, dadosProcesso, argumentos)
      return { peticao: peticao + AVISO_IA }
    } catch (err) {
      console.error('Erro ao gerar petição:', err)
      return reply.status(500).send({ error: 'Erro ao gerar rascunho' })
    }
  },

  /**
   * Analisar documento PDF
   */
  async analisarDocumento(request, reply) {
    const { documentoId } = request.body
    const { tenantId } = request.usuario

    try {
      const documento = await prisma.documento.findFirst({
        where: { id: documentoId, tenantId },
      })

      if (!documento) {
        return reply.status(404).send({ error: 'Documento não encontrado' })
      }

      // Aqui integraria com o documentParser
      // Por enquanto retorna estrutura
      return {
        sucesso: true,
        mensagem: 'Análise de documento disponível via upload direto',
      }
    } catch (err) {
      console.error('Erro ao analisar documento:', err)
      return reply.status(500).send({ error: 'Erro ao analisar documento' })
    }
  },
}
