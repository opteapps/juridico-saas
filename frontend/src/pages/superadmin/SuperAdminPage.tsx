import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Shield, Users, Building2, BarChart2, AlertTriangle } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { formatarData } from '@/lib/utils'

export function SuperAdminPage() {
  const { usuario } = useAuthStore()

  const { data: metricas } = useQuery({
    queryKey: ['superadmin-metricas'],
    queryFn: () => api.get('/super-admin/metricas').then(r => r.data),
  })

  const { data: tenants } = useQuery({
    queryKey: ['superadmin-tenants'],
    queryFn: () => api.get('/super-admin/tenants').then(r => r.data),
  })

  const { data: planos } = useQuery({
    queryKey: ['superadmin-planos'],
    queryFn: () => api.get('/super-admin/planos').then(r => r.data),
  })

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card px-6 py-4 flex items-center gap-4">
        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-lg">Super Admin</h1>
          <p className="text-sm text-muted-foreground">Painel de administração da plataforma</p>
        </div>
        <div className="ml-auto text-sm text-muted-foreground">
          {usuario?.nome}
        </div>
      </header>

      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[
            { label: 'Escritórios Ativos', value: metricas?.totalTenants, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Usuários', value: metricas?.totalUsuarios, icon: Users, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Processos', value: metricas?.totalProcessos, icon: BarChart2, color: 'text-purple-600', bg: 'bg-purple-50' },
            { label: 'Clientes', value: metricas?.totalClientes, icon: Users, color: 'text-orange-600', bg: 'bg-orange-50' },
          ].map(card => (
            <Card key={card.label}>
              <CardContent className="p-5 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center flex-shrink-0`}>
                  <card.icon className={`w-5 h-5 ${card.color}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                  <p className="text-2xl font-bold">{card.value ?? '—'}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tenants table */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader><CardTitle className="text-base">Escritórios</CardTitle></CardHeader>
              <CardContent className="p-0">
                <table className="w-full">
                  <thead><tr className="border-b bg-muted/30">
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Escritório</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Plano</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Usuários</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Status</th>
                  </tr></thead>
                  <tbody className="divide-y">
                    {tenants?.slice(0, 10).map((t: any) => (
                      <tr key={t.id} className="hover:bg-muted/20">
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium">{t.nome}</p>
                          <p className="text-xs text-muted-foreground">{t.email}</p>
                        </td>
                        <td className="px-4 py-3 text-sm">{t.plano?.nome}</td>
                        <td className="px-4 py-3 text-sm">{t._count?.usuarios}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${t.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {t.ativo ? 'Ativo' : 'Suspenso'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!tenants?.length && (
                  <div className="p-8 text-center text-muted-foreground text-sm">Nenhum escritório cadastrado</div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Plans */}
          <Card>
            <CardHeader><CardTitle className="text-base">Planos</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {planos?.map((p: any) => (
                <div key={p.id} className="p-3 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">{p.nome}</p>
                    <p className="text-sm font-bold text-primary">R$ {Number(p.preco).toFixed(2)}</p>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {p.maxUsuarios} usuários • {p.maxProcessos} processos
                  </div>
                  <div className="flex gap-1 mt-2">
                    {p.temIA && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">IA</span>}
                    {p.temMonitoramento && <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Monitor</span>}
                    {p.temPortalCliente && <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">Portal</span>}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
