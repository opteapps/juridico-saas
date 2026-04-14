import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { formatarDataHora } from '@/lib/utils'
import { Calendar, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react'

type EventoForm = {
  id?: string
  titulo: string
  tipo: string
  inicio: string
  fim: string
  local: string
  descricao: string
}

const formInicial: EventoForm = {
  titulo: '',
  tipo: 'compromisso',
  inicio: '',
  fim: '',
  local: '',
  descricao: '',
}

export function AgendaPage() {
  const [showForm, setShowForm] = useState(false)
  const [eventoEditando, setEventoEditando] = useState<EventoForm | null>(null)
  const [form, setForm] = useState<EventoForm>(formInicial)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const periodoAtual = useMemo(() => {
    const now = new Date()
    return {
      inicio: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
      fim: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString(),
    }
  }, [])

  const { data: eventos, isLoading } = useQuery({
    queryKey: ['agenda', periodoAtual.inicio, periodoAtual.fim],
    queryFn: () => api.get('/agenda', { params: periodoAtual }).then((r) => r.data),
  })

  const resetForm = () => {
    setForm(formInicial)
    setEventoEditando(null)
    setShowForm(false)
  }

  const salvarMutation = useMutation({
    mutationFn: (data: EventoForm) => eventoEditando?.id ? api.put(`/agenda/${eventoEditando.id}`, data) : api.post('/agenda', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agenda'] })
      toast({ title: eventoEditando ? 'Evento atualizado' : 'Evento criado' })
      resetForm()
    },
    onError: () => toast({ variant: 'destructive', title: 'Erro ao salvar evento' }),
  })

  const excluirMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/agenda/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agenda'] })
      toast({ title: 'Evento removido' })
    },
    onError: () => toast({ variant: 'destructive', title: 'Erro ao remover evento' }),
  })

  const tipoColors: Record<string, string> = {
    audiencia: 'bg-red-100 text-red-800',
    prazo: 'bg-orange-100 text-orange-800',
    diligencia: 'bg-yellow-100 text-yellow-800',
    reuniao: 'bg-blue-100 text-blue-800',
    compromisso: 'bg-purple-100 text-purple-800',
  }

  const abrirEdicao = (evento: any) => {
    setEventoEditando({ id: evento.id, ...evento })
    setForm({
      id: evento.id,
      titulo: evento.titulo || '',
      tipo: evento.tipo || 'compromisso',
      inicio: evento.inicio ? new Date(evento.inicio).toISOString().slice(0, 16) : '',
      fim: evento.fim ? new Date(evento.fim).toISOString().slice(0, 16) : '',
      local: evento.local || '',
      descricao: evento.descricao || '',
    })
    setShowForm(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Agenda</h1>
          <p className="text-muted-foreground">Gerencie compromissos, audiências e prazos</p>
        </div>
        <Button onClick={() => { setEventoEditando(null); setForm(formInicial); setShowForm(true) }}>
          <Plus className="w-4 h-4" /> Novo Evento
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">{eventoEditando ? 'Editar Evento' : 'Novo Evento'}</CardTitle>
            <Button variant="ghost" size="icon" onClick={resetForm}><X className="w-4 h-4" /></Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-sm font-medium mb-1.5 block">Título *</label>
                <Input placeholder="Título do evento" value={form.titulo} onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Tipo</label>
                <select className="h-10 w-full px-3 rounded-md border border-input bg-background text-sm" value={form.tipo} onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}>
                  <option value="compromisso">Compromisso</option>
                  <option value="audiencia">Audiência</option>
                  <option value="prazo">Prazo</option>
                  <option value="diligencia">Diligência</option>
                  <option value="reuniao">Reunião</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Local</label>
                <Input placeholder="Local do evento" value={form.local} onChange={(e) => setForm((f) => ({ ...f, local: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Início *</label>
                <Input type="datetime-local" value={form.inicio} onChange={(e) => setForm((f) => ({ ...f, inicio: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Fim</label>
                <Input type="datetime-local" value={form.fim} onChange={(e) => setForm((f) => ({ ...f, fim: e.target.value }))} />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium mb-1.5 block">Descrição</label>
                <Textarea value={form.descricao} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={resetForm}>Cancelar</Button>
              <Button onClick={() => salvarMutation.mutate(form)} disabled={salvarMutation.isPending || !form.titulo || !form.inicio}>
                {salvarMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                {eventoEditando ? 'Salvar alterações' : 'Salvar'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Carregando...</div>
          ) : eventos?.length === 0 ? (
            <div className="p-12 text-center">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground">Nenhum evento este mês</p>
            </div>
          ) : (
            <div className="divide-y">
              {eventos?.sort((a: any, b: any) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime()).map((ev: any) => (
                <div key={ev.id} className="flex items-center gap-4 px-6 py-4 hover:bg-muted/20">
                  <div className="text-center w-12 flex-shrink-0">
                    <p className="text-2xl font-bold">{new Date(ev.inicio).getDate()}</p>
                    <p className="text-xs text-muted-foreground">{new Date(ev.inicio).toLocaleString('pt-BR', { month: 'short' })}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{ev.titulo}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${tipoColors[ev.tipo] || 'bg-gray-100 text-gray-800'}`}>{ev.tipo}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatarDataHora(ev.inicio)}{ev.local && ` • ${ev.local}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => abrirEdicao(ev)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => {
                      const confirmado = window.confirm(`Deseja excluir o evento "${ev.titulo}"?`)
                      if (confirmado) excluirMutation.mutate(ev.id)
                    }}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}