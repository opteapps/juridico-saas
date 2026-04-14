import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Briefcase, Loader2, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  senha: z.string().min(6, 'Mínimo de 6 caracteres'),
})

type LoginForm = z.infer<typeof loginSchema>

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setLoading(true)
    try {
      const res = await api.post('/auth/login', data)
      setAuth(res.data.usuario, res.data.accessToken, res.data.refreshToken)
      navigate('/')
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao entrar',
        description: err.response?.data?.error || 'Credenciais inválidas',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-900 to-blue-700 text-white flex-col justify-center px-16">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
            <Briefcase className="w-7 h-7" />
          </div>
          <span className="text-2xl font-bold">Jurídico SaaS</span>
        </div>

        <h1 className="text-4xl font-bold mb-4">Gestão jurídica inteligente</h1>
        <p className="text-blue-200 text-lg leading-relaxed">
          Gerencie processos, clientes, prazos e finanças do seu escritório com eficiência e segurança.
        </p>

        <div className="mt-12 grid grid-cols-2 gap-6">
          {[
            { label: 'Processos monitorados', value: '100%' },
            { label: 'Economia de tempo', value: '70%' },
            { label: 'Escritórios ativos', value: '500+' },
            { label: 'Uptime garantido', value: '99,9%' },
          ].map((item) => (
            <div key={item.label} className="bg-white/10 rounded-lg p-4">
              <p className="text-2xl font-bold">{item.value}</p>
              <p className="text-blue-200 text-sm mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold">Jurídico SaaS</span>
          </div>

          <h2 className="text-2xl font-bold mb-2">Bem-vindo de volta</h2>
          <p className="text-muted-foreground mb-8">Entre com suas credenciais para acessar o sistema</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Email</label>
              <Input
                type="email"
                placeholder="seu@email.com"
                {...register('email')}
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && <p className="text-destructive text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Senha</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('senha')}
                  className={errors.senha ? 'border-destructive pr-10' : 'pr-10'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.senha && <p className="text-destructive text-xs mt-1">{errors.senha.message}</p>}
            </div>

            <div className="flex justify-end">
              <Link to="/esqueci-senha" className="text-sm text-primary hover:underline">
                Esqueceu a senha?
              </Link>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Entrar
            </Button>
          </form>

          <p className="text-center text-muted-foreground text-sm mt-8">
            Não tem conta?{' '}
            <Link to="/cadastro" className="text-primary font-medium hover:underline">
              Cadastre seu escritório
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}