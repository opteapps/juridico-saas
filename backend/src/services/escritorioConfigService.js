/**
 * Serviço de Configuração do Escritório (Cadastro Mestre)
 * Gerencia todas as configurações estruturais do escritório
 */

import { prisma } from '../database/prisma.js'
import { auditService } from './auditService.js'

// Configurações padrão do escritório
const DEFAULT_CONFIGS = {
  geral: {
    'timezone': { valor: 'America/Sao_Paulo', descricao: 'Fuso horário do escritório' },
    'formato_data': { valor: 'DD/MM/YYYY', descricao: 'Formato de data padrão' },
    'formato_moeda': { valor: 'BRL', descricao: 'Moeda padrão' },
    'idioma': { valor: 'pt-BR', descricao: 'Idioma do sistema' },
    'tema': { valor: 'light', descricao: 'Tema visual' },
  },
  monitoramento: {
    'horario_manha': { valor: '07:00', descricao: 'Horário de monitoramento da manhã' },
    'horario_tarde': { valor: '19:00', descricao: 'Horário de monitoramento da tarde' },
    'dias_semana': { valor: [1, 2, 3, 4, 5], descricao: 'Dias da semana para monitoramento (0=domingo)' },
    'monitorar_fds': { valor: false, descricao: 'Monitorar finais de semana' },
    'tentativas_maximas': { valor: 3, descricao: 'Tentativas máximas de consulta' },
  },
  notificacoes: {
    'email_ativo': { valor: true, descricao: 'Notificações por email ativas' },
    'push_ativo': { valor: true, descricao: 'Notificações push ativas' },
    'whatsapp_ativo': { valor: false, descricao: 'Notificações WhatsApp ativas' },
    'responsavel_alerta': { valor: true, descricao: 'Alertar responsável pelo processo' },
    'admin_alerta': { valor: true, descricao: 'Alertar administradores' },
  },
  sla: {
    'prazo_resposta_cliente': { valor: 24, descricao: 'SLA de resposta ao cliente (horas)' },
    'prazo_manifestacao': { valor: 48, descricao: 'SLA de manifestação interna (horas)' },
    'prazo_prazo_critico': { valor: 24, descricao: 'SLA para prazos críticos (horas)' },
    'alerta_antecedencia': { valor: [7, 3, 1], descricao: 'Dias de antecedência para alertas' },
  },
  comissionamento: {
    'tipo_calculo': { valor: 'receita_liquida', descricao: 'Base de cálculo do comissionamento' },
    'percentual_padrao': { valor: 20, descricao: 'Percentual padrão de comissão (%)' },
    'descontar_custos': { valor: true, descricao: 'Descontar custos do cálculo' },
    'pagar_parcelado': { valor: true, descricao: 'Pagar comissão proporcional ao recebimento' },
  },
  portal_cliente: {
    'ativo': { valor: true, descricao: 'Portal do cliente ativo' },
    'mostrar_documentos': { valor: true, descricao: 'Mostrar documentos no portal' },
    'mostrar_prazos': { valor: true, descricao: 'Mostrar prazos no portal' },
    'mostrar_financeiro': { valor: true, descricao: 'Mostrar financeiro no portal' },
    'permitir_mensagens': { valor: true, descricao: 'Permitir mensagens no portal' },
    'cor_primaria': { valor: '#1976d2', descricao: 'Cor primária do portal' },
    'cor_secundaria': { valor: '#424242', descricao: 'Cor secundária do portal' },
    'logo_url': { valor: null, descricao: 'Logo no portal do cliente' },
  },
}

export const escritorioConfigService = {
  /**
   * Inicializa configurações padrão do escritório
   */
  async inicializarConfiguracoes(tenantId, usuarioId) {
    const configs = []

    for (const [categoria, valores] of Object.entries(DEFAULT_CONFIGS)) {
      for (const [chave, config] of Object.entries(valores)) {
        configs.push(
          prisma.configuracaoEscritorio.upsert({
            where: {
              tenantId_categoria_chave: {
                tenantId,
                categoria,
                chave,
              },
            },
            update: {},
            create: {
              tenantId,
              categoria,
              chave,
              valor: config.valor,
              descricao: config.descricao,
            },
          })
        )
      }
    }

    await prisma.$transaction(configs)

    await auditService.log(usuarioId, 'CONFIG_INIT', 'Tenant', tenantId, {
      tenantId,
      categorias: Object.keys(DEFAULT_CONFIGS),
    })

    return { sucesso: true, message: 'Configurações inicializadas' }
  },

  /**
   * Obtém todas as configurações do escritório
   */
  async getConfiguracoes(tenantId, categoria = null) {
    const where = { tenantId }
    if (categoria) where.categoria = categoria

    const configs = await prisma.configuracaoEscritorio.findMany({
      where,
      orderBy: [{ categoria: 'asc' }, { chave: 'asc' }],
    })

    // Agrupa por categoria
    const agrupado = configs.reduce((acc, config) => {
      if (!acc[config.categoria]) {
        acc[config.categoria] = {}
      }
      acc[config.categoria][config.chave] = {
        valor: config.valor,
        descricao: config.descricao,
        atualizadoEm: config.atualizadoEm,
      }
      return acc
    }, {})

    return agrupado
  },

  /**
   * Obtém uma configuração específica
   */
  async getConfiguracao(tenantId, categoria, chave, defaultValue = null) {
    const config = await prisma.configuracaoEscritorio.findUnique({
      where: {
        tenantId_categoria_chave: {
          tenantId,
          categoria,
          chave,
        },
      },
    })

    return config?.valor ?? defaultValue
  },

  /**
   * Atualiza uma configuração
   */
  async setConfiguracao(tenantId, categoria, chave, valor, usuarioId) {
    const config = await prisma.configuracaoEscritorio.upsert({
      where: {
        tenantId_categoria_chave: {
          tenantId,
          categoria,
          chave,
        },
      },
      update: {
        valor,
      },
      create: {
        tenantId,
        categoria,
        chave,
        valor,
      },
    })

    await auditService.log(usuarioId, 'CONFIG_UPDATE', 'ConfiguracaoEscritorio', config.id, {
      tenantId,
      categoria,
      chave,
      valor,
    })

    return config
  },

  /**
   * Atualiza múltiplas configurações
   */
  async setConfiguracoes(tenantId, categoria, valores, usuarioId) {
    const updates = []

    for (const [chave, valor] of Object.entries(valores)) {
      updates.push(
        prisma.configuracaoEscritorio.upsert({
          where: {
            tenantId_categoria_chave: {
              tenantId,
              categoria,
              chave,
            },
          },
          update: { valor },
          create: {
            tenantId,
            categoria,
            chave,
            valor,
          },
        })
      )
    }

    const result = await prisma.$transaction(updates)

    await auditService.log(usuarioId, 'CONFIG_UPDATE_BULK', 'Tenant', tenantId, {
      tenantId,
      categoria,
      chaves: Object.keys(valores),
    })

    return result
  },

  /**
   * Obtém configurações de monitoramento
   */
  async getMonitoramentoConfig(tenantId) {
    const configs = await this.getConfiguracoes(tenantId, 'monitoramento')
    return configs.monitoramento || {}
  },

  /**
   * Obtém configurações de SLA
   */
  async getSLAConfig(tenantId) {
    const configs = await this.getConfiguracoes(tenantId, 'sla')
    return configs.sla || {}
  },

  /**
   * Obtém configurações de comissionamento
   */
  async getComissionamentoConfig(tenantId) {
    const configs = await this.getConfiguracoes(tenantId, 'comissionamento')
    return configs.comissionamento || {}
  },

  /**
   * Obtém configurações do portal do cliente
   */
  async getPortalClienteConfig(tenantId) {
    const configs = await this.getConfiguracoes(tenantId, 'portal_cliente')
    return configs.portal_cliente || {}
  },

  /**
   * Reseta configurações para padrão
   */
  async resetarConfiguracoes(tenantId, categoria, usuarioId) {
    const padrao = DEFAULT_CONFIGS[categoria]
    if (!padrao) {
      throw new Error(`Categoria ${categoria} não encontrada`)
    }

    // Deleta configurações existentes da categoria
    await prisma.configuracaoEscritorio.deleteMany({
      where: {
        tenantId,
        categoria,
      },
    })

    // Recria com valores padrão
    const configs = []
    for (const [chave, config] of Object.entries(padrao)) {
      configs.push(
        prisma.configuracaoEscritorio.create({
          data: {
            tenantId,
            categoria,
            chave,
            valor: config.valor,
            descricao: config.descricao,
          },
        })
      )
    }

    await prisma.$transaction(configs)

    await auditService.log(usuarioId, 'CONFIG_RESET', 'Tenant', tenantId, {
      tenantId,
      categoria,
    })

    return { sucesso: true, message: `Configurações de ${categoria} resetadas` }
  },
}
