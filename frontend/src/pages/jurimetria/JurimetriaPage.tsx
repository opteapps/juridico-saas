import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart2, Scale, TrendingUp, Award } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const CORES = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

export function JurimetriaPage() {
  const { data: dashboard } = useQuery({
    queryKey: ['jurimetria-dashboard'],
    queryFn: () => api.get('/jurimetria/dashboard').then((r) => r.data),
  })

  const { data: taxaSucesso } = useQuery({
    queryKey: ['jurimetria-taxa-sucesso'],
    queryFn: () => api.get('/jurimetria/taxa-sucesso').then((r) => r.data),
  })

  const porAreaData = dashboard?.porArea?.map((area: any) => ({
    name: area.area || 'Sem área',
    value: area._count,
  })) || []

  const porStatusData = dashboard?.porStatus?.map((status: any) => ({
    name: status.status,
    value: status._count,
  })) || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><BarChart2 className="w-6 h-6 text-primary" />Jurimetria</h1>
        <p className="text-muted-foreground">Análise estatística dos processos do escritório</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <Scale className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total de Processos</p>
              <p className="text-2xl font-bold">{dashboard?.totalProcessos ?? '—'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
              <Award className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Taxa de Sucesso</p>
              <p className="text-2xl font-bold">{taxaSucesso?.taxaSucesso ?? '—'}%</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Processos Encerrados</p>
              <p className="text-2xl font-bold">{taxaSucesso?.total ?? '—'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Distribuição por Área</CardTitle></CardHeader>
          <CardContent>
            {porAreaData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={porAreaData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                    {porAreaData.map((_: any, index: number) => <Cell key={index} fill={CORES[index % CORES.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-60 flex items-center justify-center text-muted-foreground text-sm">Sem dados suficientes</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Processos por Status</CardTitle></CardHeader>
          <CardContent>
            {porStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={porStatusData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-60 flex items-center justify-center text-muted-foreground text-sm">Sem dados suficientes</div>
            )}
          </CardContent>
        </Card>
      </div>

      {taxaSucesso && taxaSucesso.total > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Resultados dos Processos Encerrados</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-700">{taxaSucesso.procedentes}</p>
                <p className="text-sm text-green-600 mt-1">Procedentes</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-700">{taxaSucesso.acordos}</p>
                <p className="text-sm text-blue-600 mt-1">Acordos</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-700">{taxaSucesso.total - taxaSucesso.procedentes - taxaSucesso.acordos}</p>
                <p className="text-sm text-gray-600 mt-1">Outros</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}