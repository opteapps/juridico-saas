import { prisma } from '../../database/prisma.js'

export const juriController = {
  async dashboard(request, reply) {
    const { tenantId } = request.usuario

    const [
      totalProcessos,
      processosPorStatus,
      processosPorArea,
      prazosVencendo,
      movimentacoesRecentes,
    ] = await Promise.all([
      prisma.processo.count({ where: { tenantId } }),
      prisma.processo.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: true,
      }),
      prisma.processo.groupBy({
        by: ['area'],
        where: { tenantId, area: { not: null } },
        _count: true,
      }),
      prisma.prazo.count({
        where: {
          processo: { tenantId },
          status: 'pendente',
          dataVencimento: {
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            gte: new Date(),
          },
        },
      }),
      prisma.movimentacao.count({
        where: {
          processo: { tenantId },
          criadoEm: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
    ])

    return {
      totalProcessos,
      processosPorStatus: Object.fromEntries(processosPorStatus.map(p => [p.status, p._count])),
      processosPorArea: processosPorArea.map(p => ({ area: p.area, total: p._count })),
      prazosVencendo,
      movimentacoesRecentes,
    }
  },

  async taxaSucesso(request, reply) {
    const { tenantId } = request.usuario
    const { area, tribunal } = request.query

    const encerrados = await prisma.processo.findMany({
      where: {
        tenantId,
        status: 'encerrado',
        resultado: { not: null },
        ...(area ? { area } : {}),
        ...(tribunal ? { tribunal } : {}),
      },
      select: { resultado: true },
    })

    const total = encerrados.length
    const procedentes = encerrados.filter(p => p.resultado?.includes('procedente')).length
    const acordos = encerrados.filter(p => p.resultado?.includes('acordo')).length

    return {
      total,
      procedentes,
      acordos,
      taxaSucesso: total > 0 ? ((procedentes + acordos) / total * 100).toFixed(1) : 0,
    }
  },

  async produtividade(request, reply) {
    const { tenantId } = request.usuario
    const { mes, ano } = request.query

    const agora = new Date()
    const m = mes ? Number(mes) - 1 : agora.getMonth()
    const y = ano ? Number(ano) : agora.getFullYear()
    const inicio = new Date(y, m, 1)
    const fim = new Date(y, m + 1, 0)

    const advogados = await prisma.usuario.findMany({
      where: { tenantId, role: { in: ['advogado', 'estagiario', 'admin_escritorio'] }, ativo: true },
      select: {
        id: true,
        nome: true,
        processosAdv: {
          where: { processo: { status: 'ativo' } },
          select: { processoId: true },
        },
      },
    })

    return advogados.map(adv => ({
      advogado: { id: adv.id, nome: adv.nome },
      processosAtivos: adv.processosAdv.length,
    }))
  },

  async fluxoCaixa(request, reply) {
    const { tenantId } = request.usuario
    const meses = 6

    const resultado = []
    for (let i = meses - 1; i >= 0; i--) {
      const data = new Date()
      data.setMonth(data.getMonth() - i)
      const inicio = new Date(data.getFullYear(), data.getMonth(), 1)
      const fim = new Date(data.getFullYear(), data.getMonth() + 1, 0)

      const lancamentos = await prisma.lancamento.findMany({
        where: { tenantId, status: 'pago', dataPagamento: { gte: inicio, lte: fim } },
        select: { tipo: true, valor: true },
      })

      const receitas = lancamentos.filter(l => l.tipo === 'receita').reduce((a, b) => a + Number(b.valor), 0)
      const despesas = lancamentos.filter(l => l.tipo === 'despesa').reduce((a, b) => a + Number(b.valor), 0)

      resultado.push({
        mes: inicio.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
        receitas,
        despesas,
        saldo: receitas - despesas,
      })
    }

    return resultado
  },
}
