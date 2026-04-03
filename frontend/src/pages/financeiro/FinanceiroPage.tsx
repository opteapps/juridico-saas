import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { formatarMoeda, formatarData } from '@/lib/utils'
import { Plus, DollarSign, TrendingUp, TrendingDown, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function FinanceiroPage() {
  const [showForm, setShowForm] = useState(false)
  const [tipoFiltro, setTipoFiltro] = useState('')
  const [statusFiltro, setStatusFiltro] = useState('')
  const [form, setForm] = useState({ tipo: 'receita', categoria: '', descricao: '', valor: '', dataVencimento: '', status: 'pendente' })
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['financeiro', tipoFiltro, statusFiltro],
    queryFn: () => api.get('/financeiro', { params: { tipo: tipoFiltro, status: statusFiltro, limit: 50 } }).then(r => r.data),
  })

  const { data: resumo } = useQuery({
    queryKey: ['financeiro-resumo'],
    queryFn: () => api.get('/financeiro/resumo').then(r => r.data),
  })

  const mutation = useMutation({
    mutationFn: (d: any) => api.post('/financeiro', { ...d, valor: Number(d.valor) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financeiro'] })
      queryClient.invalidateQueries({ queryKey: ['financeiro-resumo'] })
      toast({ title: 'Lançamento criado!' })
      setShowForm(false)
    },
    onError: () => toast({ variant: 'destructive', title: 'Erro ao criar lançamento' }),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Financeiro</h1>
          <p className="text-muted-foreground">Controle receitas e despesas do escritório</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4" /> Novo Lançamento
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: 'Receitas', value: resumo?.totalReceitas, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Despesas', value: resumo?.totalDespesas, icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Saldo', value: resumo?.saldo, icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'A Receber', value: resumo?.aReceber, icon: DollarSign, color: 'text-yellow-600', bg: 'bg-yellow-50' },
        ].map(card => (
          <Card key={card.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase">{card.label}</p>
                  <p className="text-xl font-bold mt-1">{card.value !== undefined ? formatarMoeda(card.value) : '—'}</p>
                </div>
                <div className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center`}>
                  <card.icon className={`w-5 h-5 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {showForm && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Novo Lançamento</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}><X className="w-4 h-4" /></Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Tipo *</label>
                <select className="h-10 w-full px-3 rounded-md border border-input bg-background text-sm"
                  value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
                  <option value="receita">Receita</option>
                  <option value="despesa">Despesa</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Categoria *</label>
                <Input placeholder="Honorários, custas..." value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))} />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium mb-1.5 block">Descrição *</label>
                <Input placeholder="Descrição do lançamento" value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Valor (R$) *</label>
                <Input type="number" step="0.01" placeholder="0,00" value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Vencimento</label>
                <Input type="date" value={form.dataVencimento} onChange={e => setForm(f => ({ ...f, dataVencimento: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button onClick={() => mutation.mutate(form)} disabled={mutation.isPending || !form.descricao || !form.valor || !form.categoria}>
                {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />} Salvar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter & Table */}
      <Card>
        <CardHeader>
          <div className="flex gap-3">
            <select className="h-9 px-3 rounded-md border border-input bg-background text-sm"
              value={tipoFiltro} onChange={e => setTipoFiltro(e.target.value)}>
              <option value="">Todos os tipos</option>
              <option value="receita">Receitas</option>
              <option value="despesa">Despesas</option>
            </select>
            <select className="h-9 px-3 rounded-md border border-input bg-background text-sm"
              value={statusFiltro} onChange={e => setStatusFiltro(e.target.value)}>
              <option value="">Todos os status</option>
              <option value="pendente">Pendente</option>
              <option value="pago">Pago</option>
              <option value="vencido">Vencido</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Carregando...</div>
          ) : data?.lancamentos?.length === 0 ? (
            <div className="p-12 text-center">
              <DollarSign className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground">Nenhum lançamento encontrado</p>
            </div>
          ) : (
            <table className="w-full">
              <thead><tr className="border-b bg-muted/30">
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Descrição</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Categoria</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Vencimento</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Valor</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Status</th>
              </tr></thead>
              <tbody className="divide-y">
                {data?.lancamentos?.map((l: any) => (
                  <tr key={l.id} className="hover:bg-muted/20">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium">{l.descricao}</p>
                      {l.cliente && <p className="text-xs text-muted-foreground">{l.cliente.nome}</p>}
                    </td>
                    <td className="px-6 py-4 text-sm">{l.categoria}</td>
                    <td className="px-6 py-4 text-sm">{l.dataVencimento ? formatarData(l.dataVencimento) : '—'}</td>
                    <td className="px-6 py-4">
                      <span className={cn('text-sm font-semibold', l.tipo === 'receita' ? 'text-green-600' : 'text-red-600')}>
                        {l.tipo === 'receita' ? '+' : '-'}{formatarMoeda(Number(l.valor))}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', {
                        'bg-yellow-100 text-yellow-800': l.status === 'pendente',
                        'bg-green-100 text-green-800': l.status === 'pago',
                        'bg-red-100 text-red-800': l.status === 'vencido',
                        'bg-gray-100 text-gray-800': l.status === 'cancelado',
                      })}>{l.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
