import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { formatarData } from '@/lib/utils'
import { Plus, ClipboardList, X, Loader2, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const statusColors: Record<string, string> = {
  pendente: 'bg-yellow-100 text-yellow-800',
  em_andamento: 'bg-blue-100 text-blue-800',
  concluida: 'bg-green-100 text-green-800',
  cancelada: 'bg-gray-100 text-gray-800',
}

export function DiligenciasPage() {
  const [showForm, setShowForm] = useState(false)
  const [statusFiltro, setStatusFiltro] = useState('')
  const [form, setForm] = useState({ titulo: '', descricao: '', local: '', data: '' })
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: diligencias, isLoading } = useQuery({
    queryKey: ['diligencias', statusFiltro],
    queryFn: () => api.get('/diligencias', { params: { status: statusFiltro } }).then(r => r.data),
  })

  const mutation = useMutation({
    mutationFn: (d: any) => api.post('/diligencias', d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diligencias'] })
      toast({ title: 'Diligência criada!' })
      setShowForm(false)
    },
  })

  const concluirMutation = useMutation({
    mutationFn: (id: string) => api.put(`/diligencias/${id}`, { status: 'concluida' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['diligencias'] }),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Diligências</h1>
          <p className="text-muted-foreground">Gerencie tarefas e diligências da equipe</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}><Plus className="w-4 h-4" /> Nova Diligência</Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Nova Diligência</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}><X className="w-4 h-4" /></Button>
            </div>
            <Input placeholder="Título *" value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} />
            <Input placeholder="Local" value={form.local} onChange={e => setForm(f => ({ ...f, local: e.target.value }))} />
            <Input type="datetime-local" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} />
            <textarea className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Descrição" value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button onClick={() => mutation.mutate(form)} disabled={mutation.isPending || !form.titulo}>
                {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />} Salvar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        {['', 'pendente', 'em_andamento', 'concluida'].map(s => (
          <Button key={s} variant={statusFiltro === s ? 'default' : 'outline'} size="sm" onClick={() => setStatusFiltro(s)}>
            {s === '' ? 'Todas' : s.replace('_', ' ')}
          </Button>
        ))}
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center text-muted-foreground py-8">Carregando...</div>
        ) : diligencias?.length === 0 ? (
          <Card><CardContent className="p-12 text-center">
            <ClipboardList className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-muted-foreground">Nenhuma diligência encontrada</p>
          </CardContent></Card>
        ) : (
          diligencias?.map((d: any) => (
            <Card key={d.id}>
              <CardContent className="p-4 flex items-center gap-4">
                <Button variant="ghost" size="icon" className="flex-shrink-0" onClick={() => concluirMutation.mutate(d.id)}
                  disabled={d.status === 'concluida'}>
                  <CheckCircle className={cn('w-5 h-5', d.status === 'concluida' ? 'text-green-600' : 'text-muted-foreground')} />
                </Button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={cn('text-sm font-medium', d.status === 'concluida' && 'line-through text-muted-foreground')}>{d.titulo}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[d.status] || 'bg-gray-100 text-gray-800'}`}>
                      {d.status.replace('_', ' ')}
                    </span>
                  </div>
                  {d.descricao && <p className="text-xs text-muted-foreground mt-0.5">{d.descricao}</p>}
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    {d.local && <span>{d.local}</span>}
                    {d.data && <span>{formatarData(d.data)}</span>}
                    {d.responsavel && <span>{d.responsavel.nome}</span>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
