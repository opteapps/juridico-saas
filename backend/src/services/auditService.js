import { prisma } from '../database/prisma.js'

/**
 * Serviço de Auditoria (Audit Log)
 * Registra todas as ações importantes do sistema
 */
export const auditService = {
  /**
   * Registra uma ação no audit log
   */
  async log(usuarioId, acao, entidade, entidadeId, dados = {}, ip = null) {
    try {
      // Se não tem usuário (ação anônima), tenta obter IP do contexto
      const logData = {
        usuarioId,
        acao,
        entidade,
        entidadeId,
        dados: this.sanitizeData(dados),
        ip,
      }

      // Se tem tenantId nos dados, inclui
      if (dados.tenantId) {
        logData.tenantId = dados.tenantId
      }

      await prisma.auditLog.create({
        data: logData,
      })

      // Log em console para desenvolvimento
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[AUDIT] ${acao} - ${entidade}${entidadeId ? `:${entidadeId}` : ''} - User:${usuarioId || 'anon'}`)
      }
    } catch (error) {
      // Não deve quebrar a aplicação se falhar o log
      console.error('Erro ao registrar audit log:', error)
    }
  },

  /**
   * Registra login bem-sucedido
   */
  async logLogin(usuarioId, tenantId, ip, userAgent) {
    return this.log(usuarioId, 'LOGIN_SUCCESS', 'Usuario', usuarioId, {
      tenantId,
      ip,
      userAgent: userAgent?.substring(0, 200),
    }, ip)
  },

  /**
   * Registra tentativa de login falha
   */
  async logLoginFailed(email, ip, reason) {
    return this.log(null, 'LOGIN_FAILED', 'Usuario', null, {
      email: this.maskEmail(email),
      reason,
      ip,
    }, ip)
  },

  /**
   * Registra logout
   */
  async logLogout(usuarioId, tenantId, ip) {
    return this.log(usuarioId, 'LOGOUT', 'Usuario', usuarioId, { tenantId }, ip)
  },

  /**
   * Registra criação de registro
   */
  async logCreate(usuarioId, entidade, entidadeId, dados, tenantId, ip) {
    return this.log(usuarioId, 'CREATE', entidade, entidadeId, {
      tenantId,
      newData: dados,
    }, ip)
  },

  /**
   * Registra atualização de registro
   */
  async logUpdate(usuarioId, entidade, entidadeId, oldData, newData, tenantId, ip) {
    return this.log(usuarioId, 'UPDATE', entidade, entidadeId, {
      tenantId,
      changes: this.diffObjects(oldData, newData),
    }, ip)
  },

  /**
   * Registra exclusão de registro
   */
  async logDelete(usuarioId, entidade, entidadeId, dados, tenantId, ip) {
    return this.log(usuarioId, 'DELETE', entidade, entidadeId, {
      tenantId,
      deletedData: dados,
    }, ip)
  },

  /**
   * Registra acesso a dados sensíveis
   */
  async logSensitiveAccess(usuarioId, entidade, entidadeId, tipo, tenantId, ip) {
    return this.log(usuarioId, 'SENSITIVE_ACCESS', entidade, entidadeId, {
      tenantId,
      accessType: tipo,
    }, ip)
  },

  /**
   * Registra exportação de dados
   */
  async logExport(usuarioId, entidade, quantidade, formato, tenantId, ip) {
    return this.log(usuarioId, 'EXPORT', entidade, null, {
      tenantId,
      quantidade,
      formato,
    }, ip)
  },

  /**
   * Registra alteração de permissões
   */
  async logPermissionChange(usuarioId, targetUserId, oldRole, newRole, tenantId, ip) {
    return this.log(usuarioId, 'PERMISSION_CHANGE', 'Usuario', targetUserId, {
      tenantId,
      oldRole,
      newRole,
    }, ip)
  },

  /**
   * Busca logs de auditoria
   */
  async queryLogs(filters = {}, options = {}) {
    const {
      tenantId,
      usuarioId,
      entidade,
      acao,
      dataInicio,
      dataFim,
    } = filters

    const where = {}

    if (tenantId) where.tenantId = tenantId
    if (usuarioId) where.usuarioId = usuarioId
    if (entidade) where.entidade = entidade
    if (acao) where.acao = acao
    if (dataInicio || dataFim) {
      where.criadoEm = {}
      if (dataInicio) where.criadoEm.gte = new Date(dataInicio)
      if (dataFim) where.criadoEm.lte = new Date(dataFim)
    }

    const { page = 1, limit = 50 } = options

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          usuario: {
            select: { nome: true, email: true },
          },
        },
        orderBy: { criadoEm: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ])

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }
  },

  /**
   * Obtém estatísticas de auditoria
   */
  async getStats(tenantId, periodoDias = 30) {
    const dataInicio = new Date()
    dataInicio.setDate(dataInicio.getDate() - periodoDias)

    const where = {
      criadoEm: { gte: dataInicio },
    }
    if (tenantId) where.tenantId = tenantId

    const stats = await prisma.auditLog.groupBy({
      by: ['acao'],
      where,
      _count: { acao: true },
    })

    const porEntidade = await prisma.auditLog.groupBy({
      by: ['entidade'],
      where,
      _count: { entidade: true },
    })

    return {
      porAcao: stats,
      porEntidade,
      periodo: periodoDias,
    }
  },

  /**
   * Compara dois objetos e retorna diferenças
   */
  diffObjects(oldObj, newObj) {
    const changes = {}
    
    const allKeys = new Set([...Object.keys(oldObj || {}), ...Object.keys(newObj || {})])
    
    for (const key of allKeys) {
      const oldVal = oldObj?.[key]
      const newVal = newObj?.[key]
      
      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        changes[key] = { from: oldVal, to: newVal }
      }
    }
    
    return changes
  },

  /**
   * Sanitiza dados sensíveis
   */
  sanitizeData(dados) {
    if (!dados || typeof dados !== 'object') return dados

    const sensitiveFields = ['senha', 'password', 'token', 'secret', 'creditCard', 'cpf', 'rg']
    const sanitized = { ...dados }

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '***REDACTED***'
      }
    }

    return sanitized
  },

  /**
   * Mascara email
   */
  maskEmail(email) {
    if (!email) return null
    const [user, domain] = email.split('@')
    if (!domain) return email
    return `${user.substring(0, 2)}***@${domain}`
  },
}
