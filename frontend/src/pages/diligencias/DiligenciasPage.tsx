import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { formatarData, cn } from '@/lib/utils'
import { CheckCircle, ClipboardList, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react'

type DiligenciaForm = {
  id?: string
  titulo: string
  descricao: string
  local: string
  data: string
  status: string
  responsavelId?: string
}

const statusColors: Record<string, string> = {
  pendente: 'bg-yellow-100 text-yellow-800',
  em_andamento: 'bg-blue-100 text-blue-800',
  concluida: 'bg-green-100 text-green-800',
  cancelada: 'bg-gray-100 text-gray-800',
}

const formInicial: DiligenciaForm = {
  titulo: '',
  descricao: '',
  local: '',
  data: '',
  status: 'pendente',
}

export function DiligenciasPage() {
  const [showForm, setShowForm] = useState(false)
  const [statusFiltro, setStatusFiltro] = useState('')
  const [diligenciaEditando, setDiligenciaEditando] = useState<DiligenciaForm | null>(null)
  const [form, setForm] = useState<DiligenciaForm>(formInicial)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: diligencias, isLoading } = useQuery({
    queryKey: ['diligencias', statusFiltro],
    queryFn: () => api.get('/diligencias', { params: { status: statusFiltro } }).then((r) => r.data),
  })

  const { data: usuarios } = useQuery({
    queryKey: ['usuarios-diligencias'],
    queryFn: () => api.get('/usuarios').then((r) => r.data ?? []),
  })

  const resetForm = () => {
    setForm(formInicial)
    setDiligenciaEditando(null)
    setShowForm(false)
  }

  const salvarMutation = useMutation({
    mutationFn: (payload: DiligenciaForm) => diligenciaEditando?.id ? api.put(`/diligencias/${diligenciaEditando.id}`, payload) : api.post('/diligencias', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diligencias'] })
      toast({ title: diligenciaEditando ? 'Diligência atualizada' : 'Diligência criada' })
      resetForm()
    },
    onError: () => toast({ variant: 'destructive', title: 'Erro ao salvar diligência' }),
  })

  const concluirMutation = useMutation({
    mutationFn: (id: string) => api.put(`/diligencias/${id}`, { status: 'concluida' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diligencias'] })
      toast({ title: 'Diligência concluída' })
    },
  })

  const cancelarMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/diligencias/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diligencias'] })
      toast({ title: 'Diligência cancelada' })
    },
  })

  const abrirEdicao = (diligencia: any) => {
    setDiligenciaEditando({ id: diligencia.id, ...diligencia })
    setForm({
      id: diligencia.id,
      titulo: diligencia.titulo || '',
      descricao: diligencia.descricao || '',
      local: diligencia.local || '',
      data: diligencia.data ? new Date(diligencia.data).toISOString().slice(0, 16) : '',
      status: diligencia.status || 'pendente',
      responsavelId: diligencia.responsavelId || '',
    })
    setShowForm(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Diligências</h1>
          <p className="text-muted-foreground">Gerencie tarefas e diligências da equipe</p>
        </div>
        <Button onClick={() => { setDiligenciaEditando(null); setForm(formInicial); setShowForm(true) }}><Plus className="w-4 h-4" /> Nova Diligência</Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">{diligenciaEditando ? 'Editar Diligência' : 'Nova Diligência'}</h3>
              <Button variant="ghost" size="icon" onClick={resetForm}><X className="w-4 h-4" /></Button>
            </div>
            <Input placeholder="Título *" value={form.titulo} onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))} />
            <Input placeholder="Local" value={form.local} onChange={(e) => setForm((f) => ({ ...f, local: e.target.value }))} />
            <Input type="datetime-local" value={form.data} onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))} />
            <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
              <option value="pendente">Pendente</option>
              <option value="em_andamento">Em andamento</option>
              <option value="concluida">Concluída</option>
              <option value="cancelada">Cancelada</option>
            </select>
            <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.responsavelId || ''} onChange={(e) => setForm((f) => ({ ...f, responsavelId: e.target.value || undefined }))}>
              <option value="">Responsável atual</option>
              {usuarios?.map((usuario: any) => (
                <option key={usuario.id} value={usuario.id}>{usuario.nome}</option>
              ))}
            </select>
            <Textarea placeholder="Descrição" value={form.descricao} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={resetForm}>Cancelar</Button>
              <Button onClick={() => salvarMutation.mutate(form)} disabled={salvarMutation.isPending || !form.titulo}>
                {salvarMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />} Salvar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        {['', 'pendente', 'em_andamento', 'concluida'].map((status) => (
          <Button key={status} variant={statusFiltro === status ? 'default' : 'outline'} size="sm" onClick={() => setStatusFiltro(status)}>
            {status === '' ? 'Todas' : status.replace('_', ' ')}
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
          diligencias?.map((diligencia: any) => (
            <Card key={diligencia.id}>
              <CardContent className="p-4 flex items-center gap-4">
                <Button variant="ghost" size="icon" className="flex-shrink-0" onClick={() => concluirMutation.mutate(diligencia.id)} disabled={diligencia.status === 'concluida'}>
                  <CheckCircle className={cn('w-5 h-5', diligencia.status === 'concluida' ? 'text-green-600' : 'text-muted-foreground')} />
                </Button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={cn('text-sm font-medium', diligencia.status === 'concluida' && 'line-through text-muted-foreground')}>{diligencia.titulo}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[diligencia.status] || 'bg-gray-100 text-gray-800'}`}>
                      {diligencia.status.replace('_', ' ')}
                    </span>
                  </div>
                  {diligencia.descricao && <p className="text-xs text-muted-foreground mt-0.5">{diligencia.descricao}</p>}
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    {diligencia.local && <span>{diligencia.local}</span>}
                    {diligencia.data && <span>{formatarData(diligencia.data)}</span>}
                    {diligencia.responsavel && <span>{diligencia.responsavel.nome}</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => abrirEdicao(diligencia)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  {diligencia.status !== 'cancelada' && (
                    <Button variant="ghost" size="icon" onClick={() => cancelarMutation.mutate(diligencia.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}