import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { formatarData, formatarMoeda, cn } from '@/lib/utils'
import { DollarSign, Loader2, Pencil, Plus, TrendingDown, TrendingUp, X } from 'lucide-react'

type LancamentoForm = {
  id?: string
  tipo: string
  categoria: string
  descricao: string
  valor: string
  dataVencimento: string
  status: string
}

const formInicial: LancamentoForm = {
  tipo: 'receita',
  categoria: '',
  descricao: '',
  valor: '',
  dataVencimento: '',
  status: 'pendente',
}

export function FinanceiroPage() {
  const [showForm, setShowForm] = useState(false)
  const [tipoFiltro, setTipoFiltro] = useState('')
  const [statusFiltro, setStatusFiltro] = useState('')
  const [lancamentoEditando, setLancamentoEditando] = useState<LancamentoForm | null>(null)
  const [form, setForm] = useState<LancamentoForm>(formInicial)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['financeiro', tipoFiltro, statusFiltro],
    queryFn: () => api.get('/financeiro', { params: { tipo: tipoFiltro, status: statusFiltro, limit: 50 } }).then((r) => r.data),
  })

  const { data: resumo } = useQuery({
    queryKey: ['financeiro-resumo'],
    queryFn: () => api.get('/financeiro/resumo').then((r) => r.data),
  })

  const resetForm = () => {
    setForm(formInicial)
    setLancamentoEditando(null)
    setShowForm(false)
  }

  const salvarMutation = useMutation({
    mutationFn: (payload: LancamentoForm) => {
      const body = { ...payload, valor: Number(payload.valor) }
      return lancamentoEditando?.id ? api.put(`/financeiro/${lancamentoEditando.id}`, body) : api.post('/financeiro', body)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financeiro'] })
      queryClient.invalidateQueries({ queryKey: ['financeiro-resumo'] })
      toast({ title: lancamentoEditando ? 'Lançamento atualizado' : 'Lançamento criado' })
      resetForm()
    },
    onError: () => toast({ variant: 'destructive', title: 'Erro ao salvar lançamento' }),
  })

  const pagarMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/financeiro/${id}/pagar`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financeiro'] })
      queryClient.invalidateQueries({ queryKey: ['financeiro-resumo'] })
      toast({ title: 'Lançamento marcado como pago' })
    },
    onError: () => toast({ variant: 'destructive', title: 'Erro ao marcar lançamento como pago' }),
  })

  const cancelarMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/financeiro/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financeiro'] })
      queryClient.invalidateQueries({ queryKey: ['financeiro-resumo'] })
      toast({ title: 'Lançamento cancelado' })
    },
    onError: () => toast({ variant: 'destructive', title: 'Erro ao cancelar lançamento' }),
  })

  const abrirEdicao = (lancamento: any) => {
    setLancamentoEditando({ id: lancamento.id, ...lancamento })
    setForm({
      id: lancamento.id,
      tipo: lancamento.tipo || 'receita',
      categoria: lancamento.categoria || '',
      descricao: lancamento.descricao || '',
      valor: String(Number(lancamento.valor || 0)),
      dataVencimento: lancamento.dataVencimento ? new Date(lancamento.dataVencimento).toISOString().slice(0, 10) : '',
      status: lancamento.status || 'pendente',
    })
    setShowForm(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Financeiro</h1>
          <p className="text-muted-foreground">Controle receitas e despesas do escritório</p>
        </div>
        <Button onClick={() => { setLancamentoEditando(null); setForm(formInicial); setShowForm(true) }}>
          <Plus className="w-4 h-4" /> Novo Lançamento
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: 'Receitas', value: resumo?.totalReceitas, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Despesas', value: resumo?.totalDespesas, icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Saldo', value: resumo?.saldo, icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'A Receber', value: resumo?.aReceber, icon: DollarSign, color: 'text-yellow-600', bg: 'bg-yellow-50' },
        ].map((card) => (
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
            <CardTitle className="text-base">{lancamentoEditando ? 'Editar Lançamento' : 'Novo Lançamento'}</CardTitle>
            <Button variant="ghost" size="icon" onClick={resetForm}><X className="w-4 h-4" /></Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Tipo *</label>
                <select className="h-10 w-full px-3 rounded-md border border-input bg-background text-sm" value={form.tipo} onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}>
                  <option value="receita">Receita</option>
                  <option value="despesa">Despesa</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Categoria *</label>
                <Input value={form.categoria} onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))} />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium mb-1.5 block">Descrição *</label>
                <Input value={form.descricao} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Valor (R$) *</label>
                <Input type="number" step="0.01" value={form.valor} onChange={(e) => setForm((f) => ({ ...f, valor: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Vencimento</label>
                <Input type="date" value={form.dataVencimento} onChange={(e) => setForm((f) => ({ ...f, dataVencimento: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Status</label>
                <select className="h-10 w-full px-3 rounded-md border border-input bg-background text-sm" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                  <option value="pendente">Pendente</option>
                  <option value="pago">Pago</option>
                  <option value="vencido">Vencido</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={resetForm}>Cancelar</Button>
              <Button onClick={() => salvarMutation.mutate(form)} disabled={salvarMutation.isPending || !form.descricao || !form.valor || !form.categoria}>
                {salvarMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />} {lancamentoEditando ? 'Salvar alterações' : 'Salvar'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex gap-3">
            <select className="h-9 px-3 rounded-md border border-input bg-background text-sm" value={tipoFiltro} onChange={(e) => setTipoFiltro(e.target.value)}>
              <option value="">Todos os tipos</option>
              <option value="receita">Receitas</option>
              <option value="despesa">Despesas</option>
            </select>
            <select className="h-9 px-3 rounded-md border border-input bg-background text-sm" value={statusFiltro} onChange={(e) => setStatusFiltro(e.target.value)}>
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
                <th className="px-6 py-3" />
              </tr></thead>
              <tbody className="divide-y">
                {data?.lancamentos?.map((lancamento: any) => (
                  <tr key={lancamento.id} className="hover:bg-muted/20">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium">{lancamento.descricao}</p>
                      {lancamento.cliente && <p className="text-xs text-muted-foreground">{lancamento.cliente.nome}</p>}
                    </td>
                    <td className="px-6 py-4 text-sm">{lancamento.categoria}</td>
                    <td className="px-6 py-4 text-sm">{lancamento.dataVencimento ? formatarData(lancamento.dataVencimento) : '—'}</td>
                    <td className="px-6 py-4">
                      <span className={cn('text-sm font-semibold', lancamento.tipo === 'receita' ? 'text-green-600' : 'text-red-600')}>
                        {lancamento.tipo === 'receita' ? '+' : '-'}{formatarMoeda(Number(lancamento.valor))}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', {
                        'bg-yellow-100 text-yellow-800': lancamento.status === 'pendente',
                        'bg-green-100 text-green-800': lancamento.status === 'pago',
                        'bg-red-100 text-red-800': lancamento.status === 'vencido',
                        'bg-gray-100 text-gray-800': lancamento.status === 'cancelado',
                      })}>{lancamento.status}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => abrirEdicao(lancamento)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        {lancamento.status !== 'pago' && (
                          <Button variant="outline" size="sm" onClick={() => pagarMutation.mutate(lancamento.id)}>
                            Pagar
                          </Button>
                        )}
                        {lancamento.status !== 'cancelado' && (
                          <Button variant="destructive" size="sm" onClick={() => cancelarMutation.mutate(lancamento.id)}>
                            Cancelar
                          </Button>
                        )}
                      </div>
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