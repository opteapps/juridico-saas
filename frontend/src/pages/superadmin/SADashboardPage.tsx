import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { formatarMoeda } from '@/lib/utils'
import { Building2, Users, FileText, TrendingUp } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

export function SADashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['sa-estatisticas'],
    queryFn: () => api.get('/super-admin/estatisticas').then((r) => r.data),
  })

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-64" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, index) => <div key={index} className="h-32 bg-gray-200 rounded-xl" />)}
          </div>
        </div>
      </div>
    )
  }

  const stats = [
    { label: 'Escritórios Ativos', value: data?.tenantsAtivos ?? 0, total: data?.totalTenants, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Usuários no Sistema', value: data?.totalUsuarios ?? 0, icon: Users, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Processos Cadastrados', value: data?.totalProcessos ?? 0, icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Receita Mensal (MRR)', value: formatarMoeda(data?.receitaMensalRecorrente ?? 0), icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ]

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Painel Administrativo</h1>
        <p className="text-gray-500 mt-1">Visão geral do sistema JurídicoSaaS</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border p-6 shadow-sm">
            <div className={`inline-flex p-3 rounded-lg ${stat.bg} mb-4`}>
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            {stat.total && <p className="text-xs text-gray-400">{stat.total} total cadastrados</p>}
            <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {data?.distribuicaoPlanos?.length > 0 && (
          <div className="bg-white rounded-xl border p-6 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-4">Distribuição por Plano</h2>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={data.distribuicaoPlanos} dataKey="total" nameKey="plano" cx="50%" cy="50%" outerRadius={80} label={({ plano, total }: { plano: string; total: number }) => `${plano}: ${total}`}>
                  {data.distribuicaoPlanos.map((_: unknown, index: number) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number | string, n: string) => [v, n]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="bg-white rounded-xl border p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-2">Resumo do Mês</h2>
          <div className="space-y-4 mt-4">
            <div className="flex justify-between items-center py-3 border-b">
              <span className="text-sm text-gray-600">Novos escritórios</span>
              <span className="font-semibold text-blue-600">{data?.novosEscritoriosMes ?? 0}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b">
              <span className="text-sm text-gray-600">Assinaturas ativas</span>
              <span className="font-semibold text-green-600">{data?.assinaturasAtivas ?? 0}</span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-sm text-gray-600">MRR (Receita Recorrente)</span>
              <span className="font-semibold text-emerald-600">{formatarMoeda(data?.receitaMensalRecorrente ?? 0)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}