import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Briefcase, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

const registerSchema = z.object({
  nome: z.string().min(2, 'Mínimo 2 caracteres'),
  email: z.string().email('Email inválido'),
  senha: z.string().min(8, 'Mínimo 8 caracteres'),
  nomeEscritorio: z.string().min(2, 'Mínimo 2 caracteres'),
  cnpj: z.string().optional(),
})

type RegisterForm = z.infer<typeof registerSchema>

export function RegisterPage() {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true)
    try {
      await api.post('/auth/register', data)
      toast({ title: 'Escritório criado!', description: 'Agora faça login para acessar o sistema.' })
      navigate('/login')
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao cadastrar',
        description: err.response?.data?.error || 'Tente novamente',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-muted/30">
      <div className="w-full max-w-lg bg-card rounded-2xl shadow-lg p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Briefcase className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold">Jurídico SaaS</span>
        </div>

        <h2 className="text-2xl font-bold mb-2">Crie seu escritório</h2>
        <p className="text-muted-foreground mb-8">Preencha os dados para começar o período de teste gratuito</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-sm font-medium mb-1.5 block">Nome do escritório *</label>
              <Input placeholder="Escritório Silva & Advogados" {...register('nomeEscritorio')} />
              {errors.nomeEscritorio && <p className="text-destructive text-xs mt-1">{errors.nomeEscritorio.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Seu nome *</label>
              <Input placeholder="Dr. João Silva" {...register('nome')} />
              {errors.nome && <p className="text-destructive text-xs mt-1">{errors.nome.message}</p>}
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">CNPJ</label>
              <Input placeholder="00.000.000/0000-00" {...register('cnpj')} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium mb-1.5 block">Email *</label>
              <Input type="email" placeholder="contato@escritorio.com" {...register('email')} />
              {errors.email && <p className="text-destructive text-xs mt-1">{errors.email.message}</p>}
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium mb-1.5 block">Senha *</label>
              <Input type="password" placeholder="Mínimo 8 caracteres" {...register('senha')} />
              {errors.senha && <p className="text-destructive text-xs mt-1">{errors.senha.message}</p>}
            </div>
          </div>

          <Button type="submit" className="w-full mt-2" disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Criar escritório
          </Button>
        </form>

        <p className="text-center text-muted-foreground text-sm mt-6">
          Já tem conta?{' '}
          <Link to="/login" className="text-primary font-medium hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
