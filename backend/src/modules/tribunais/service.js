import axios from 'axios'
import { prisma } from '../../database/prisma.js'

// Configuração das APIs dos tribunais
const TRIBUNAIS = {
  datajud: {
    name: 'DataJud (CNJ)',
    baseUrl: 'https://api-publica.datajud.cnj.jus.br',
    apiKey: process.env.DATAJUD_API_KEY,
  },
  stf: {
    name: 'Supremo Tribunal Federal',
    baseUrl: 'https://portal.stf.jus.br/api',
    // STF não requer API key pública para consultas básicas
  },
  stj: {
    name: 'Superior Tribunal de Justiça',
    baseUrl: 'https://processo.stj.jus.br/api',
  },
}

export const tribunalIntegrationService = {
  /**
   * Consulta processo no DataJud (CNJ)
   * @param {string} numeroProcesso - Número do processo no formato CNJ
   */
  async consultarDataJud(numeroProcesso) {
    try {
      const tribunal = this.identificarTribunal(numeroProcesso)
      const url = `${TRIBUNAIS.datajud.baseUrl}/${tribunal}/processos/${numeroProcesso}`
      
      const response = await axios.get(url, {
        headers: {
          'Authorization': `ApiKey ${TRIBUNAIS.datajud.apiKey}`,
          'Accept': 'application/json',
        },
        timeout: 30000,
      })

      return this.normalizarDadosDataJud(response.data)
    } catch (error) {
      console.error('Erro ao consultar DataJud:', error.message)
      throw new Error(`Processo não encontrado no DataJud: ${error.message}`)
    }
  },

  /**
   * Consulta processo no STF
   * @param {string} numeroProcesso 
   */
  async consultarSTF(numeroProcesso) {
    try {
      const url = `${TRIBUNAIS.stf.baseUrl}/processos/${numeroProcesso}`
      
      const response = await axios.get(url, {
        headers: { 'Accept': 'application/json' },
        timeout: 30000,
      })

      return this.normalizarDadosSTF(response.data)
    } catch (error) {
      console.error('Erro ao consultar STF:', error.message)
      throw new Error(`Processo não encontrado no STF: ${error.message}`)
    }
  },

  /**
   * Consulta processo no STJ
   * @param {string} numeroProcesso 
   */
  async consultarSTJ(numeroProcesso) {
    try {
      const url = `${TRIBUNAIS.stj.baseUrl}/processo/${numeroProcesso}`
      
      const response = await axios.get(url, {
        headers: { 'Accept': 'application/json' },
        timeout: 30000,
      })

      return this.normalizarDadosSTJ(response.data)
    } catch (error) {
      console.error('Erro ao consultar STJ:', error.message)
      throw new Error(`Processo não encontrado no STJ: ${error.message}`)
    }
  },

  /**
   * Identifica o tribunal a partir do número do processo CNJ
   * Formato: NNNNNNN-DD.AAAA.J.TR.OOOO
   * TR = Código do tribunal
   */
  identificarTribunal(numeroProcesso) {
    const numeroLimpo = numeroProcesso.replace(/[^0-9]/g, '')
    const codigoTribunal = numeroLimpo.substring(13, 15)
    
    const tribunais = {
      '01': 'stf',
      '02': 'stj',
      '03': 'tst',
      '04': 'tse',
      '05': 'tst',
    }

    return tribunais[codigoTribunal] || 'tj' + codigoTribunal
  },

  /**
   * Consulta processo em todos os tribunais disponíveis
   * @param {string} numeroProcesso 
   */
  async consultarTodosTribunais(numeroProcesso) {
    const resultados = []
    const tribunal = this.identificarTribunal(numeroProcesso)

    // Tenta DataJud primeiro (base nacional)
    try {
      const dataJud = await this.consultarDataJud(numeroProcesso)
      resultados.push({ fonte: 'DataJud', dados: dataJud })
    } catch (e) {
      console.log('DataJud não retornou dados:', e.message)
    }

    // Tenta tribunal específico
    if (tribunal === 'stf') {
      try {
        const stf = await this.consultarSTF(numeroProcesso)
        resultados.push({ fonte: 'STF', dados: stf })
      } catch (e) {
        console.log('STF não retornou dados:', e.message)
      }
    }

    if (tribunal === 'stj') {
      try {
        const stj = await this.consultarSTJ(numeroProcesso)
        resultados.push({ fonte: 'STJ', dados: stj })
      } catch (e) {
        console.log('STJ não retornou dados:', e.message)
      }
    }

    return resultados
  },

  /**
   * Busca movimentações de um processo
   * @param {string} numeroProcesso 
   * @param {string} tribunal - Código do tribunal
   */
  async buscarMovimentacoes(numeroProcesso, tribunal = 'datajud') {
    try {
      if (tribunal === 'datajud') {
        const dados = await this.consultarDataJud(numeroProcesso)
        return dados.movimentacoes || []
      }
      
      // Fallback para outros tribunais
      const resultados = await this.consultarTodosTribunais(numeroProcesso)
      const primeiro = resultados.find(r => r.dados?.movimentacoes)
      return primeiro?.dados?.movimentacoes || []
    } catch (error) {
      console.error('Erro ao buscar movimentações:', error.message)
      return []
    }
  },

  /**
   * Normaliza dados do DataJud para formato padrão
   */
  normalizarDadosDataJud(data) {
    return {
      numeroProcesso: data.numeroProcesso,
      classe: data.classe?.nome,
      assuntos: data.assuntos?.map(a => a.nome) || [],
      dataAjuizamento: data.dataAjuizamento,
      orgaoJulgador: data.orgaoJulgador?.nome,
      nivelSigilo: data.nivelSigilo,
      movimentacoes: data.movimentacoes?.map(m => ({
        data: m.dataHora,
        descricao: m.descricao,
        codigo: m.codigo,
        tipo: this.classificarTipoMovimentacao(m.descricao),
      })) || [],
      partes: data.partes?.map(p => ({
        nome: p.nome,
        tipo: p.tipo,
        documento: p.documento,
      })) || [],
    }
  },

  /**
   * Normaliza dados do STF
   */
  normalizarDadosSTF(data) {
    return {
      numeroProcesso: data.numero,
      classe: data.classe_processual,
      assuntos: data.assunto ? [data.assunto] : [],
      dataAjuizamento: data.data_autuacao,
      orgaoJulgador: 'STF',
      movimentacoes: data.andamentos?.map(a => ({
        data: a.data,
        descricao: a.descricao,
        tipo: this.classificarTipoMovimentacao(a.descricao),
      })) || [],
      partes: [],
    }
  },

  /**
   * Normaliza dados do STJ
   */
  normalizarDadosSTJ(data) {
    return {
      numeroProcesso: data.numero,
      classe: data.classe,
      assuntos: data.assuntos || [],
      dataAjuizamento: data.data_autuacao,
      orgaoJulgador: 'STJ',
      movimentacoes: data.movimentacoes?.map(m => ({
        data: m.data,
        descricao: m.descricao,
        tipo: this.classificarTipoMovimentacao(m.descricao),
      })) || [],
      partes: data.partes || [],
    }
  },

  /**
   * Classifica o tipo de movimentação baseado na descrição
   */
  classificarTipoMovimentacao(descricao) {
    const desc = descricao?.toLowerCase() || ''
    
    if (desc.includes('prazo') || desc.includes('intimação') || desc.includes('citação')) {
      return 'PRAZO_PROCESSUAL'
    }
    if (desc.includes('audiência') || desc.includes('sessão')) {
      return 'AUDIENCIA'
    }
    if (desc.includes('decisão') || desc.includes('sentença') || desc.includes('acórdão')) {
      return 'DECISAO'
    }
    if (desc.includes('despacho')) {
      return 'DESPACHO'
    }
    if (desc.includes('conclusos')) {
      return 'CONCLUSOS'
    }
    if (desc.includes('transitado') || desc.includes('trânsito em julgado')) {
      return 'TRANSITO_JULGADO'
    }
    if (desc.includes('arquivamento') || desc.includes('baixa')) {
      return 'ARQUIVAMENTO'
    }
    
    return 'OUTROS'
  },
}
