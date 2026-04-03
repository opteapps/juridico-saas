import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  monitoramentoAtivo: z.boolean().default(true),
})

type NovoProcessoForm = z.infer<typeof novoProcessoSchema>

export function NovoProcessoPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { register, handleSubmit, formState: { errors } } = useForm<NovoProcessoForm>({
    resolver: zodResolver(novoProcessoSchema),
    defaultValues: { monitoramentoAtivo: true },
  })

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
              <textarea
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Descrição detalhada do processo..."
                {...register('descricao')}
              />
            </div>

            <div className="flex items-center gap-3">
              <input type="checkbox" id="monitoramento" {...register('monitoramentoAtivo')} className="h-4 w-4" />
              <label htmlFor="monitoramento" className="text-sm">Ativar monitoramento automático nos tribunais</label>
            </div>
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
