import axios from 'axios'

const DATAJUD_BASE_URL = 'https://api-publica.datajud.cnj.jus.br'

const datajudClient = axios.create({
  baseURL: DATAJUD_BASE_URL,
  timeout: 30000,
  headers: {
    'Authorization': `APIKey ${process.env.DATAJUD_API_KEY || 'cDZHYzlZa0JadVREZDJCendFbGtlenBTRzU3'}`,
    'Content-Type': 'application/json',
  },
})

const TRIBUNAL_INDICES = {
  'TJSP': 'api_publica_tjsp',
  'TJRJ': 'api_publica_tjrj',
  'TJMG': 'api_publica_tjmg',
  'TRF1': 'api_publica_trf1',
  'TRF2': 'api_publica_trf2',
  'TRF3': 'api_publica_trf3',
  'TRF4': 'api_publica_trf4',
  'TRF5': 'api_publica_trf5',
  'TRT1': 'api_publica_trt1',
  'TRT2': 'api_publica_trt2',
  'TRT3': 'api_publica_trt3',
  'TRT15': 'api_publica_trt15',
  'TST': 'api_publica_tst',
  'STJ': 'api_publica_stj',
  'STF': 'api_publica_stf',
}

export async function consultarDataJud(numeroProcesso, tribunal = null) {
  const numero = numeroProcesso.replace(/\D/g, '')
  
  const codigoTribunal = tribunal || extrairTribunalDoNumero(numero)
  const indice = codigoTribunal ? TRIBUNAL_INDICES[codigoTribunal] : null
  
  const endpoint = indice
    ? `/${indice}/_search`
    : '/api_publica_cnj/_search'
  
  try {
    const response = await datajudClient.post(endpoint, {
      query: {
        match: { numeroProcesso: numero },
      },
      size: 1,
    })
    
    const hits = response.data?.hits?.hits
    if (!hits || hits.length === 0) return null
    
    return normalizarProcessoDataJud(hits[0]._source)
  } catch (error) {
    console.error('DataJud error:', error.message)
    return null
  }
}

export async function buscarMovimentacoesDataJud(numeroProcesso, tribunal = null) {
  const dados = await consultarDataJud(numeroProcesso, tribunal)
  if (!dados) return []
  
  return dados.movimentos || []
}

export async function buscarProcessosPorCpfCnpj(cpfCnpj, tribunal = null) {
  const documento = cpfCnpj.replace(/\D/g, '')
  const endpoint = tribunal ? `/${TRIBUNAL_INDICES[tribunal]}/_search` : '/api_publica_cnj/_search'
  
  try {
    const response = await datajudClient.post(endpoint, {
      query: {
        bool: {
          should: [
            { match: { 'partes.documento': documento } },
            { match: { 'partes.advogados.documento': documento } },
          ],
        },
      },
      size: 100,
    })
    
    return response.data?.hits?.hits?.map(h => normalizarProcessoDataJud(h._source)) || []
  } catch (error) {
    console.error('DataJud busca CPF error:', error.message)
    return []
  }
}

function extrairTribunalDoNumero(numero) {
  if (numero.length < 20) return null
  const codigoTribunal = numero.slice(13, 15)
  const codigoOrgao = numero.slice(15, 20)
  
  const mapa = {
    '8': { '0026': 'TJSP', '0001': 'TJRJ', '0013': 'TJMG' },
    '4': { '0001': 'TRF1', '0002': 'TRF2', '0003': 'TRF3', '0004': 'TRF4', '0005': 'TRF5' },
    '5': { '0001': 'TRT1', '0002': 'TRT2', '0003': 'TRT3', '0015': 'TRT15' },
  }
  
  return mapa[codigoTribunal]?.[codigoOrgao.slice(0, 4)] || null
}

function normalizarProcessoDataJud(source) {
  return {
    numero: source.numeroProcesso,
    tribunal: source.tribunal?.sigla || source.orgaoJulgador?.codigo,
    orgaoJulgador: source.orgaoJulgador?.nome,
    dataAjuizamento: source.dataAjuizamento,
    classeProcessual: source.classe?.nome,
    assuntos: source.assuntos?.map(a => a.nome) || [],
    partes: source.partes || [],
    movimentos: source.movimentos?.map(m => ({
      data: m.dataHora,
      tipo: m.tipoMovimento?.nome || m.nome,
      descricao: m.complemento || m.nome,
      codigo: m.codigo,
    })) || [],
  }
}
