import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { AREAS_ATUACAO } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

const editarProcessoSchema = z.object({
  numero: z.string().min(20, 'Número CNJ inválido'),
  tribunal: z.string().optional(),
  vara: z.string().optional(),
  forum: z.string().optional(),
  juiz: z.string().optional(),
  area: z.string().optional(),
  assunto: z.string().optional(),
  valorCausa: z.number().optional(),
  status: z.enum(['ativo', 'suspenso', 'encerrado', 'arquivado']),
  descricao: z.string().optional(),
  observacoes: z.string().optional(),
  monitoramentoAtivo: z.boolean().default(true),
  clienteIds: z.array(z.string()).default([]),
  advogadoIds: z.array(z.string()).default([]),
})

type EditarProcessoForm = z.infer<typeof editarProcessoSchema>

export function EditarProcessoPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: processo, isLoading } = useQuery({
    queryKey: ['processo', id],
    queryFn: () => api.get(`/processos/${id}`).then(r => r.data),
    enabled: Boolean(id),
  })

  const { data: clientes } = useQuery({
    queryKey: ['clientes-selecao-processo'],
    queryFn: () => api.get('/clientes', { params: { limit: 100 } }).then(r => r.data?.clientes ?? []),
  })

  const { data: usuarios } = useQuery({
    queryKey: ['usuarios-selecao-processo'],
    queryFn: () => api.get('/usuarios').then(r => r.data ?? []),
  })

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<EditarProcessoForm>({
    resolver: zodResolver(editarProcessoSchema),
    defaultValues: {
      status: 'ativo',
      monitoramentoAtivo: true,
      clienteIds: [],
      advogadoIds: [],
    },
  })

  useEffect(() => {
    if (processo) {
      reset({
        numero: processo.numero || '',
        tribunal: processo.tribunal || '',
        vara: processo.vara || '',
        forum: processo.forum || '',
        juiz: processo.juiz || '',
        area: processo.area || '',
        assunto: processo.assunto || '',
        valorCausa: processo.valorCausa ? Number(processo.valorCausa) : undefined,
        status: processo.status || 'ativo',
        descricao: processo.descricao || '',
        observacoes: processo.observacoes || '',
        monitoramentoAtivo: Boolean(processo.monitoramentoAtivo),
        clienteIds: processo.clientes?.map((item: any) => item.clienteId) || [],
        advogadoIds: processo.advogados?.map((item: any) => item.usuarioId) || [],
      })
    }
  }, [processo, reset])

  const clienteIds = watch('clienteIds')
  const advogadoIds = watch('advogadoIds')

  const mutation = useMutation({
    mutationFn: (data: EditarProcessoForm) => api.put(`/processos/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['processos'] })
      queryClient.invalidateQueries({ queryKey: ['processo', id] })
      toast({ title: 'Processo atualizado com sucesso' })
      navigate(`/processos/${id}`)
    },
    onError: (error: any) => {
      toast({ variant: 'destructive', title: 'Erro ao atualizar processo', description: error.response?.data?.error || 'Tente novamente' })
    },
  })

  const toggleSelecao = (field: 'clienteIds' | 'advogadoIds', value: string) => {
    const atual = watch(field)
    const proximo = atual.includes(value) ? atual.filter(item => item !== value) : [...atual, value]
    setValue(field, proximo, { shouldValidate: true })
  }

  if (isLoading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Carregando...</div>

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/processos/${id}`)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Editar Processo</h1>
          <p className="text-muted-foreground">Atualize os dados e vínculos do processo</p>
        </div>
      </div>

      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Dados do processo</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Número CNJ *</label>
              <Input {...register('numero')} className={errors.numero ? 'border-destructive' : ''} />
              {errors.numero && <p className="text-destructive text-xs mt-1">{errors.numero.message}</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Tribunal</label>
                <Input {...register('tribunal')} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Vara</label>
                <Input {...register('vara')} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Fórum</label>
                <Input {...register('forum')} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Juiz</label>
                <Input {...register('juiz')} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Área</label>
                <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" {...register('area')}>
                  <option value="">Selecione...</option>
                  {AREAS_ATUACAO.map(area => <option key={area} value={area}>{area}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Valor da causa</label>
                <Input type="number" step="0.01" {...register('valorCausa', { valueAsNumber: true })} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Status</label>
                <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" {...register('status')}>
                  <option value="ativo">Ativo</option>
                  <option value="suspenso">Suspenso</option>
                  <option value="encerrado">Encerrado</option>
                  <option value="arquivado">Arquivado</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Assunto</label>
              <Input {...register('assunto')} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Descrição</label>
              <Textarea {...register('descricao')} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Observações</label>
              <Textarea {...register('observacoes')} />
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="monitoramento" {...register('monitoramentoAtivo')} className="h-4 w-4" />
              <label htmlFor="monitoramento" className="text-sm">Monitoramento automático ativo</label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Clientes vinculados</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {clientes?.map((cliente: any) => {
                const ativo = clienteIds.includes(cliente.id)
                return (
                  <button
                    key={cliente.id}
                    type="button"
                    onClick={() => toggleSelecao('clienteIds', cliente.id)}
                    className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${ativo ? 'border-primary bg-primary text-primary-foreground' : 'border-input bg-background'}`}
                  >
                    {cliente.nome}
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Equipe responsável</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {usuarios?.map((usuario: any) => {
                const ativo = advogadoIds.includes(usuario.id)
                return (
                  <button
                    key={usuario.id}
                    type="button"
                    onClick={() => toggleSelecao('advogadoIds', usuario.id)}
                    className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${ativo ? 'border-primary bg-primary text-primary-foreground' : 'border-input bg-background'}`}
                  >
                    {usuario.nome}
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate(`/processos/${id}`)}>Cancelar</Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Salvar alterações
          </Button>
        </div>
      </form>
    </div>
  )
}