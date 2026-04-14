import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { AREAS_ATUACAO } from '@/lib/utils'

const novoProcessoSchema = z.object({
  numero: z.string().min(20, 'Número CNJ inválido (mínimo 20 dígitos)'),
  tribunal: z.string().optional(),
  vara: z.string().optional(),
  area: z.string().optional(),
  assunto: z.string().optional(),
  valorCausa: z.number().optional(),
  descricao: z.string().optional(),
  clienteIds: z.array(z.string()).default([]),
  advogadoIds: z.array(z.string()).default([]),
  monitoramentoAtivo: z.boolean().default(true),
})

type NovoProcessoForm = z.infer<typeof novoProcessoSchema>

export function NovoProcessoPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: clientes } = useQuery({
    queryKey: ['clientes-selecao-processo'],
    queryFn: () => api.get('/clientes', { params: { limit: 100 } }).then(r => r.data?.clientes ?? []),
  })

  const { data: usuarios } = useQuery({
    queryKey: ['usuarios-selecao-processo'],
    queryFn: () => api.get('/usuarios').then(r => r.data ?? []),
  })

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<NovoProcessoForm>({
    resolver: zodResolver(novoProcessoSchema),
    defaultValues: { monitoramentoAtivo: true, clienteIds: [], advogadoIds: [] },
  })

  const clienteIds = watch('clienteIds')
  const advogadoIds = watch('advogadoIds')

  const mutation = useMutation({
    mutationFn: (data: NovoProcessoForm) => api.post('/processos', data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['processos'] })
      toast({ title: 'Processo criado!', description: 'O processo foi adicionado com sucesso.' })
      navigate(`/processos/${res.data.id}`)
    },
    onError: (err: any) => {
      toast({ variant: 'destructive', title: 'Erro', description: err.response?.data?.error || 'Tente novamente' })
    },
  })

  const toggleSelecao = (field: 'clienteIds' | 'advogadoIds', value: string) => {
    const atual = watch(field)
    const proximo = atual.includes(value)
      ? atual.filter((item) => item !== value)
      : [...atual, value]

    setValue(field, proximo, { shouldValidate: true })
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/processos')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Novo Processo</h1>
          <p className="text-muted-foreground">Cadastre um novo processo no sistema</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(d => mutation.mutate(d))}>
        <Card>
          <CardHeader><CardTitle className="text-base">Dados do Processo</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Número CNJ *</label>
              <Input
                placeholder="00000000-00.0000.0.00.0000"
                {...register('numero')}
                className={errors.numero ? 'border-destructive' : ''}
              />
              {errors.numero && <p className="text-destructive text-xs mt-1">{errors.numero.message}</p>}
              <p className="text-xs text-muted-foreground mt-1">Formato: NNNNNNN-DD.AAAA.J.TT.OOOO (20 dígitos sem formatação)</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Tribunal</label>
                <Input placeholder="TJSP, TRF3, TRT2..." {...register('tribunal')} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Vara</label>
                <Input placeholder="1ª Vara Cível" {...register('vara')} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Área</label>
                <select className="h-10 w-full px-3 rounded-md border border-input bg-background text-sm" {...register('area')}>
                  <option value="">Selecione...</option>
                  {AREAS_ATUACAO.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Valor da Causa (R$)</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  {...register('valorCausa', { valueAsNumber: true })}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Assunto</label>
              <Input placeholder="Ação de cobrança, indenização..." {...register('assunto')} />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Descrição</label>
              <Textarea placeholder="Descrição detalhada do processo..." {...register('descricao')} />
            </div>

            <div className="flex items-center gap-3">
              <input type="checkbox" id="monitoramento" {...register('monitoramentoAtivo')} className="h-4 w-4" />
              <label htmlFor="monitoramento" className="text-sm">Ativar monitoramento automático nos tribunais</label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Vincular clientes</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {!clientes?.length ? (
              <p className="text-sm text-muted-foreground">Nenhum cliente disponível. Cadastre um cliente antes de vincular ao processo.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {clientes.map((cliente: any) => {
                  const ativo = clienteIds.includes(cliente.id)
                  return (
                    <button
                      key={cliente.id}
                      type="button"
                      onClick={() => toggleSelecao('clienteIds', cliente.id)}
                      className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                        ativo ? 'border-primary bg-primary text-primary-foreground' : 'border-input bg-background'
                      }`}
                    >
                      {cliente.nome}
                    </button>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Equipe responsável</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {!usuarios?.length ? (
              <p className="text-sm text-muted-foreground">Nenhum usuário disponível para vincular.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {usuarios.map((usuario: any) => {
                  const ativo = advogadoIds.includes(usuario.id)
                  return (
                    <button
                      key={usuario.id}
                      type="button"
                      onClick={() => toggleSelecao('advogadoIds', usuario.id)}
                      className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                        ativo ? 'border-primary bg-primary text-primary-foreground' : 'border-input bg-background'
                      }`}
                    >
                      {usuario.nome}
                    </button>
                  )
                })}
              </div>
            )}

            {advogadoIds.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {usuarios
                  ?.filter((usuario: any) => advogadoIds.includes(usuario.id))
                  .map((usuario: any) => (
                    <Badge key={usuario.id} variant="secondary">{usuario.nome}</Badge>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="outline" onClick={() => navigate('/processos')}>Cancelar</Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Criar Processo
          </Button>
        </div>
      </form>
    </div>
  )
}
