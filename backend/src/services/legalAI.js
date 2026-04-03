import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

/**
 * Módulo de IA Jurídica
 * Responsável por análises, resumos e sugestões jurídicas
 */
export const legalAI = {
  /**
   * Resumir processo completo
   */
  async resumirProcesso(processo, movimentacoes) {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

    const prompt = `
Você é um assistente jurídico especializado. Resuma o seguinte processo de forma clara e objetiva:

NÚMERO: ${processo.numero}
ASSUNTO: ${processo.assunto}
CLASSE: ${processo.classe}
VARA: ${processo.vara}
STATUS: ${processo.status}

PARTES:
${processo.partes?.map(p => `- ${p.tipo}: ${p.nome}`).join('\n') || 'Não informado'}

MOVIMENTAÇÕES RECENTES:
${movimentacoes.slice(0, 10).map(m => `- ${new Date(m.data).toLocaleDateString('pt-BR')}: ${m.descricao}`).join('\n')}

Forneça:
1. Resumo executivo (máximo 3 linhas)
2. Posição processual atual
3. Próximos passos prováveis
4. Riscos ou pontos de atenção
`

    try {
      const result = await model.generateContent(prompt)
      return result.response.text()
    } catch (error) {
      console.error('Erro ao resumir processo:', error)
      return 'Não foi possível gerar o resumo. Tente novamente mais tarde.'
    }
  },

  /**
   * Explicar decisão judicial
   */
  async explicarDecisao(textoDecisao, contextoProcesso) {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

    const prompt = `
Você é um advogado experiente. Explique a seguinte decisão judicial de forma acessível:

DECISÃO:
${textoDecisao}

CONTEXTO DO PROCESSO:
${contextoProcesso}

Forneça:
1. Resumo da decisão (o que foi decidido)
2. Fundamento legal principal
3. Impacto na estratégia do processo
4. Prazos ou obrigações geradas
5. Recomendação de próximos passos
`

    try {
      const result = await model.generateContent(prompt)
      return result.response.text()
    } catch (error) {
      console.error('Erro ao explicar decisão:', error)
      return 'Não foi possível analisar a decisão.'
    }
  },

  /**
   * Explicar movimentação processual
   */
  async explicarMovimentacao(descricaoMovimentacao, tipo) {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

    const prompt = `
Explique a seguinte movimentação processual de forma simples:

MOVIMENTAÇÃO: ${descricaoMovimentacao}
TIPO: ${tipo}

Forneça:
1. O que significa esta movimentação
2. Qual o impacto no processo
3. Se gera algum prazo ou obrigação
4. O que o advogado deve fazer
`

    try {
      const result = await model.generateContent(prompt)
      return result.response.text()
    } catch (error) {
      console.error('Erro ao explicar movimentação:', error)
      return 'Não foi possível analisar a movimentação.'
    }
  },

  /**
   * Sugerir estratégia jurídica
   */
  async sugerirEstrategia(processo, historico, objetivo) {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

    const prompt = `
Você é um advogado estrategista. Analise o processo e sugira estratégias:

PROCESSO: ${processo.numero}
ASSUNTO: ${processo.assunto}
STATUS: ${processo.status}

HISTÓRICO RECENTE:
${historico.slice(0, 5).map(h => `- ${h}`).join('\n')}

OBJETIVO DO CLIENTE: ${objetivo}

Forneça:
1. Análise da situação atual
2. Estratégias recomendadas (curto, médio e longo prazo)
3. Riscos a considerar
4. Cenários possíveis
5. Próximos passos prioritários
`

    try {
      const result = await model.generateContent(prompt)
      return result.response.text()
    } catch (error) {
      console.error('Erro ao sugerir estratégia:', error)
      return 'Não foi possível gerar sugestões.'
    }
  },

  /**
   * Gerar rascunho de petição
   */
  async gerarPeticao(tipoPeticao, dadosProcesso, argumentos) {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

    const templates = {
      'CONTESTACAO': 'Contestação',
      'RECURSO': 'Recurso',
      'MANIFESTACAO': 'Manifestação',
      'MEMORIAL': 'Memorial',
      'QUESITOS': 'Quesitos',
      'INFORMACAO': 'Informação',
    }

    const prompt = `
Você é um advogado especialista. Elabore um rascunho de ${templates[tipoPeticao] || tipoPeticao}:

DADOS DO PROCESSO:
${JSON.stringify(dadosProcesso, null, 2)}

ARGUMENTOS E FATOS:
${argumentos}

Elabore:
1. Cabeçalho completo
2. Preliminares (se houver)
3. Mérito com argumentação jurídica
4. Pedidos
5. Fechamento

IMPORTANTE: Este é um rascunho para revisão. Não substitui o trabalho do advogado.
`

    try {
      const result = await model.generateContent(prompt)
      return result.response.text()
    } catch (error) {
      console.error('Erro ao gerar petição:', error)
      return 'Não foi possível gerar o rascunho.'
    }
  },

  /**
   * Analisar risco de processo
   */
  async analisarRisco(processo, movimentacoes) {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

    const prompt = `
Analise o risco deste processo para o escritório:

PROCESSO: ${processo.numero}
ASSUNTO: ${processo.assunto}
VALOR CAUSA: ${processo.valorCausa}
STATUS: ${processo.status}

MOVIMENTAÇÕES RECENTES:
${movimentacoes.slice(0, 5).map(m =
  `- ${m.descricao}`).join('\n')}

Forneça:
1. Nível de risco (Baixo/Médio/Alto)
2. Justificativa do risco
3. Fatores favoráveis
4. Fatores desfavoráveis
5. Recomendações de mitigação
`

    try {
      const result = await model.generateContent(prompt)
      return result.response.text()
    } catch (error) {
      console.error('Erro ao analisar risco:', error)
      return 'Não foi possível analisar o risco.'
    }
  },

  /**
   * Chat jurídico
   */
  async chat(pergunta, contexto = null) {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

    let prompt = `
Você é um assistente jurídico brasileiro. Responda de forma clara e objetiva.

IMPORTANTE: 
- Você é uma ferramenta de apoio, não substitui um advogado
- Não forneça conselhos jurídicos definitivos
- Sempre sugira consultar um advogado para decisões importantes

PERGUNTA: ${pergunta}
`

    if (contexto) {
      prompt += `\nCONTEXTO: ${JSON.stringify(contexto)}`
    }

    try {
      const result = await model.generateContent(prompt)
      return result.response.text()
    } catch (error) {
      console.error('Erro no chat:', error)
      return 'Desculpe, não consegui processar sua pergunta. Tente novamente.'
    }
  },
}
