import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatarMoeda, formatarDataRelativa } from '@/lib/utils'
import { Scale, Users, Calendar, DollarSign, AlertTriangle, TrendingUp, Clock, CheckCircle } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'

const CORES = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

export function DashboardPage() {
  const { usuario } = useAuthStore()

  const { data: metricas } = useQuery({
    queryKey: ['dashboard-metricas'],
    queryFn: () => api.get('/jurimetria/dashboard').then(r => r.data),
  })

  const { data: financeiro } = useQuery({
    queryKey: ['dashboard-financeiro'],
    queryFn: () => api.get('/financeiro/resumo').then(r => r.data),
  })

  const { data: prazosQuery } = useQuery({
    queryKey: ['dashboard-prazos'],
    queryFn: () => api.get('/processos?limit=5').then(r => r.data),
  })

  const cards = [
    {
      label: 'Total de Processos',
      value: metricas?.totalProcessos ?? '—',
      icon: Scale,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'A Receber',
      value: financeiro?.aReceber !== undefined ? formatarMoeda(financeiro.aReceber) : '—',
      icon: DollarSign,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: 'Receitas do Mês',
      value: financeiro?.totalReceitas !== undefined ? formatarMoeda(financeiro.totalReceitas) : '—',
      icon: TrendingUp,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Saldo',
      value: financeiro?.saldo !== undefined ? formatarMoeda(financeiro.saldo) : '—',
      icon: CheckCircle,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
    },
  ]

  const porAreaData = metricas?.porArea?.map((a: any) => ({
    name: a.area || 'Sem área',
    value: a._count,
  })) || []

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold">Olá, {usuario?.nome?.split(' ')[0]}!</h1>
        <p className="text-muted-foreground mt-1">Aqui está um resumo do seu escritório</p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  <p className="text-2xl font-bold mt-1">{card.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl ${card.bg} flex items-center justify-center`}>
                  <card.icon className={`w-6 h-6 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Area chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Processos por Mês</CardTitle>
          </CardHeader>
          <CardContent>
            {metricas?.porMes && metricas.porMes.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={metricas.porMes}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="total" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-60 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Scale className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Nenhum dado ainda</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pie chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Processos por Área</CardTitle>
          </CardHeader>
          <CardContent>
            {porAreaData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={porAreaData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                    {porAreaData.map((_: any, i: number) => (
                      <Cell key={i} fill={CORES[i % CORES.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-60 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Sem dados por área</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status summary */}
      {metricas?.porStatus && metricas.porStatus.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status dos Processos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {metricas.porStatus.map((s: any) => (
                <div key={s.status} className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">{s._count}</p>
                  <p className="text-sm text-muted-foreground capitalize mt-1">{s.status}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
