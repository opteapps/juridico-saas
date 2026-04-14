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
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { AREAS_ATUACAO } from '@/lib/utils'

const editarClienteSchema = z.object({
  tipo: z.enum(['pessoa_fisica', 'pessoa_juridica']),
  nome: z.string().min(2, 'Mínimo 2 caracteres'),
  cpfCnpj: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefone: z.string().optional(),
  celular: z.string().optional(),
  profissao: z.string().optional(),
  endereco: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  cep: z.string().optional(),
  observacoes: z.string().optional(),
  areas: z.array(z.string()).default([]),
  tagsTexto: z.string().optional(),
})

type EditarClienteForm = z.infer<typeof editarClienteSchema>

export function EditarClientePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: cliente, isLoading } = useQuery({
    queryKey: ['cliente', id],
    queryFn: () => api.get(`/clientes/${id}`).then(r => r.data),
    enabled: Boolean(id),
  })

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<EditarClienteForm>({
    resolver: zodResolver(editarClienteSchema),
    defaultValues: {
      tipo: 'pessoa_fisica',
      areas: [],
      tagsTexto: '',
    },
  })

  useEffect(() => {
    if (cliente) {
      reset({
        tipo: cliente.tipo || 'pessoa_fisica',
        nome: cliente.nome || '',
        cpfCnpj: cliente.cpfCnpj || '',
        email: cliente.email || '',
        telefone: cliente.telefone || '',
        celular: cliente.celular || '',
        profissao: cliente.profissao || '',
        endereco: cliente.endereco || '',
        cidade: cliente.cidade || '',
        estado: cliente.estado || '',
        cep: cliente.cep || '',
        observacoes: cliente.observacoes || '',
        areas: cliente.areas || [],
        tagsTexto: Array.isArray(cliente.tags) ? cliente.tags.join(', ') : '',
      })
    }
  }, [cliente, reset])

  const areasSelecionadas = watch('areas')

  const mutation = useMutation({
    mutationFn: (data: EditarClienteForm) =>
      api.put(`/clientes/${id}`, {
        ...data,
        email: data.email || undefined,
        tags: data.tagsTexto ? data.tagsTexto.split(',').map(tag => tag.trim()).filter(Boolean) : [],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      queryClient.invalidateQueries({ queryKey: ['cliente', id] })
      toast({ title: 'Cliente atualizado com sucesso' })
      navigate(`/clientes/${id}`)
    },
    onError: (error: any) => {
      toast({ variant: 'destructive', title: 'Erro ao atualizar cliente', description: error.response?.data?.error || 'Tente novamente' })
    },
  })

  const toggleArea = (area: string) => {
    const proximoValor = areasSelecionadas.includes(area)
      ? areasSelecionadas.filter(item => item !== area)
      : [...areasSelecionadas, area]
    setValue('areas', proximoValor, { shouldValidate: true })
  }

  if (isLoading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Carregando...</div>

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/clientes/${id}`)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Editar Cliente</h1>
          <p className="text-muted-foreground">Atualize os dados cadastrais do cliente</p>
        </div>
      </div>

      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Dados principais</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Tipo</label>
                <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" {...register('tipo')}>
                  <option value="pessoa_fisica">Pessoa física</option>
                  <option value="pessoa_juridica">Pessoa jurídica</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">CPF/CNPJ</label>
                <Input {...register('cpfCnpj')} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Nome *</label>
                <Input {...register('nome')} className={errors.nome ? 'border-destructive' : ''} />
                {errors.nome && <p className="text-destructive text-xs mt-1">{errors.nome.message}</p>}
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Profissão</label>
                <Input {...register('profissao')} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Email</label>
                <Input type="email" {...register('email')} className={errors.email ? 'border-destructive' : ''} />
                {errors.email && <p className="text-destructive text-xs mt-1">{errors.email.message}</p>}
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Telefone</label>
                <Input {...register('telefone')} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Celular</label>
              <Input {...register('celular')} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Endereço e classificação</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Endereço</label>
              <Input {...register('endereco')} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Cidade</label>
                <Input {...register('cidade')} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Estado</label>
                <Input {...register('estado')} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">CEP</label>
                <Input {...register('cep')} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Áreas de atuação relacionadas</label>
              <div className="flex flex-wrap gap-2">
                {AREAS_ATUACAO.map((area) => {
                  const ativo = areasSelecionadas.includes(area)
                  return (
                    <button
                      key={area}
                      type="button"
                      onClick={() => toggleArea(area)}
                      className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${ativo ? 'border-primary bg-primary text-primary-foreground' : 'border-input bg-background'}`}
                    >
                      {area}
                    </button>
                  )
                })}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Tags</label>
              <Input {...register('tagsTexto')} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Observações</CardTitle></CardHeader>
          <CardContent>
            <Textarea {...register('observacoes')} />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate(`/clientes/${id}`)}>Cancelar</Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Salvar alterações
          </Button>
        </div>
      </form>
    </div>
  )
}