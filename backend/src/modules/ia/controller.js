import { GoogleGenerativeAI } from '@google/generative-ai'
import { prisma } from '../../database/prisma.js'

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
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
      
      const prompt = contexto
        ? `${SYSTEM_PROMPT}\n\nContexto do processo: ${JSON.stringify(contexto)}\n\nPergunta: ${mensagem}`
        : `${SYSTEM_PROMPT}\n\nPergunta: ${mensagem}`
      
      const result = await model.generateContent(prompt)
      const resposta = result.response.text()
      
      return { resposta: resposta + AVISO_IA }
    } catch (err) {
      console.error('Gemini error:', err)
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
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
      
      const prompt = `${SYSTEM_PROMPT}
      
      Resuma o seguinte processo jurídico de forma objetiva:
      
      Número: ${processo.numero}
      Área: ${processo.area || 'Não informada'}
      Tribunal: ${processo.tribunal || 'Não informado'}
      Vara: ${processo.vara || 'Não informada'}
      Juiz: ${processo.juiz || 'Não informado'}
      Status: ${processo.status}
      Assunto: ${processo.assunto || 'Não informado'}
      Clientes: ${processo.clientes.map(c => c.cliente.nome).join(', ')}
      
      Últimas movimentações:
      ${processo.movimentacoes.map(m => `- ${new Date(m.data).toLocaleDateString('pt-BR')}: ${m.descricao}`).join('\n')}
      
      Forneça um resumo executivo do processo.`
      
      const result = await model.generateContent(prompt)
      return { resumo: result.response.text() + AVISO_IA }
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
      const texto = result.response.text().replace(/\`\`\`json\n?|\n?\`\`\`/g, '').trim()
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
      const texto = result.response.text().replace(/\`\`\`json\n?|\n?\`\`\`/g, '').trim()
      return JSON.parse(texto)
    } catch {
      return { prazos: [] }
    }
  },
}
