import pdf from 'pdf-parse'

/**
 * Serviço de parsing de documentos jurídicos
 * Extrai texto e identifica informações relevantes
 */
export const documentParser = {
  /**
   * Extrai texto de PDF
   */
  async extrairTextoPDF(buffer) {
    try {
      const data = await pdf(buffer)
      return {
        texto: data.text,
        paginas: data.numpages,
        info: data.info,
      }
    } catch (error) {
      console.error('Erro ao extrair PDF:', error)
      throw new Error('Não foi possível extrair o texto do PDF')
    }
  },

  /**
   * Identifica partes no documento
   */
  identificarPartes(texto) {
    const partes = []
    const linhas = texto.split('\n')

    // Padrões para identificar partes
    const padroes = [
      { tipo: 'AUTOR', regex: /(?:AUTOR|REQUERENTE|EXEQUENTE|IMPETRANTE)[\s:]+([^\n]+)/gi },
      { tipo: 'REU', regex: /(?:R[ÉE]U|REQUERIDO|EXECUTADO|IMPETRADO)[\s:]+([^\n]+)/gi },
      { tipo: 'ADVOGADO', regex: /(?:ADVOGADO|PROCURADOR)[\s:]+([^\n,]+)/gi },
      { tipo: 'JUIZ', regex: /(?:JUIZ|JU[ÍI]ZA|MAGISTRADO)[\s:]+([^\n]+)/gi },
      { tipo: 'TESTEMUNHA', regex: /(?:TESTEMUNHA)[\s:]+([^\n]+)/gi },
    ]

    for (const padrao of padroes) {
      let match
      while ((match = padrao.regex.exec(texto)) !== null) {
        const nome = match[1]?.trim()
        if (nome && nome.length > 3) {
          partes.push({
            tipo: padrao.tipo,
            nome: this.limparNome(nome),
          })
        }
      }
    }

    // Remove duplicados
    return partes.filter((parte, index, self) =
      index === self.findIndex(p => p.nome === parte.nome && p.tipo === parte.tipo)
    )
  },

  /**
   * Identifica decisões no documento
   */
  identificarDecisoes(texto) {
    const decisoes = []

    // Padrões de decisões
    const padroesDecisao = [
      /(?:DECIS[ÃA]O|SENTEN[ÇC]A|AC[ÓO]RD[ÃA]O|DESPACHO)[\s:]+([^]+?)(?=\n\n|\n[A-Z]|$)/gi,
      /(?:INTIMO|DEFIRO|INDEFIRO|CONCEDO|NEGO)[\s:]+([^]+?)(?=\n\n|\n[A-Z]|$)/gi,
    ]

    for (const padrao of padroesDecisao) {
      let match
      while ((match = padrao.exec(texto)) !== null) {
        const trecho = match[0]?.trim()
        if (trecho && trecho.length > 20) {
          decisoes.push({
            tipo: this.classificarDecisao(trecho),
            trecho: trecho.substring(0, 500) + (trecho.length > 500 ? '...' : ''),
            data: this.extrairData(trecho),
          })
        }
      }
    }

    return decisoes
  },

  /**
   * Classifica tipo de decisão
   */
  classificarDecisao(texto) {
    const t = texto.toLowerCase()
    
    if (t.includes('sentença')) return 'SENTENCA'
    if (t.includes('acórdão') || t.includes('acordao')) return 'ACORDAO'
    if (t.includes('despacho')) return 'DESPACHO'
    if (t.includes('decisão') || t.includes('decisao')) return 'DECISAO'
    if (t.includes('defiro')) return 'DEFERIMENTO'
    if (t.includes('indefiro')) return 'INDEFERIMENTO'
    if (t.includes('intimo')) return 'INTIMACAO'
    if (t.includes('concedo')) return 'CONCESSAO'
    if (t.includes('nego')) return 'NEGATIVA'
    
    return 'OUTROS'
  },

  /**
   * Extrai datas do texto
   */
  extrairData(texto) {
    // Padrões de data
    const padroes = [
      /(\d{1,2})[\/\.\-](\d{1,2})[\/\.\-](\d{2,4})/g,
      /(\d{1,2})\s+de\s+(janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\s+de\s+(\d{4})/gi,
    ]

    for (const padrao of padroes) {
      const match = padrao.exec(texto)
      if (match) {
        return match[0]
      }
    }

    return null
  },

  /**
   * Identifica número do processo
   */
  identificarNumeroProcesso(texto) {
    // Padrão CNJ: NNNNNNN-DD.AAAA.J.TR.OOOO
    const padraoCNJ = /\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}/g
    const match = padraoCNJ.exec(texto)
    
    if (match) {
      return match[0]
    }

    // Padrão antigo
    const padraoAntigo = /\d{3,7}\.\d{3}/g
    const matchAntigo = padraoAntigo.exec(texto)
    
    return matchAntigo ? matchAntigo[0] : null
  },

  /**
   * Extrai valor da causa
   */
  extrairValorCausa(texto) {
    const padroes = [
      /valor\s+(?:da\s+)?causa[\s:]*R?\$?\s*([\d\.]+,?\d{0,2})/gi,
      /R?\$\s*([\d\.]+,?\d{0,2})/g,
    ]

    for (const padrao of padroes) {
      const match = padrao.exec(texto)
      if (match) {
        const valor = match[1]?.replace(/\./g, '').replace(',', '.')
        return parseFloat(valor)
      }
    }

    return null
  },

  /**
   * Resume conteúdo do documento
   */
  async resumirDocumento(texto, maxLinhas = 10) {
    const linhas = texto.split('\n').filter(l => l.trim().length > 0)
    
    // Pega primeiras linhas significativas
    const inicio = linhas.slice(0, Math.min(5, linhas.length))
    
    // Pega últimas linhas (geralmente contêm decisões)
    const fim = linhas.slice(Math.max(0, linhas.length - 5))
    
    return {
      resumo: [...inicio, '...', ...fim].join('\n'),
      totalLinhas: linhas.length,
      totalCaracteres: texto.length,
    }
  },

  /**
   * Análise completa de documento
   */
  async analisarDocumento(buffer) {
    try {
      // Extrai texto
      const { texto, paginas } = await this.extrairTextoPDF(buffer)

      // Identifica elementos
      const partes = this.identificarPartes(texto)
      const decisoes = this.identificarDecisoes(texto)
      const numeroProcesso = this.identificarNumeroProcesso(texto)
      const valorCausa = this.extrairValorCausa(texto)
      const resumo = await this.resumirDocumento(texto)

      return {
        sucesso: true,
        paginas,
        numeroProcesso,
        valorCausa,
        partes,
        decisoes,
        resumo: resumo.resumo,
        estatisticas: {
          totalCaracteres: texto.length,
          totalLinhas: resumo.totalLinhas,
          quantidadePartes: partes.length,
          quantidadeDecisoes: decisoes.length,
        },
      }
    } catch (error) {
      console.error('Erro ao analisar documento:', error)
      return {
        sucesso: false,
        erro: error.message,
      }
    }
  },

  /**
   * Limpa nome extraído
   */
  limparNome(nome) {
    return nome
      .replace(/\s+/g, ' ')
      .replace(/[\(\)\[\]]/g, '')
      .replace(/\d+/g, '')
      .trim()
      .substring(0, 100)
  },
}
