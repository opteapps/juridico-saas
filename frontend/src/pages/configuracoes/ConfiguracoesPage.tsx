import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/store/auth'
import { Settings, User, Building2, Shield } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function ConfiguracoesPage() {
  const { usuario } = useAuthStore()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'perfil' | 'escritorio' | 'seguranca'>('perfil')
  const [perfilForm, setPerfilForm] = useState({ nome: '', email: '', oab: '', telefone: '' })
  const [escritorioForm, setEscritorioForm] = useState({ nome: '', telefone: '', endereco: '' })
  const [senhaForm, setSenhaForm] = useState({ atual: '', nova: '', confirmar: '' })

  const { data: perfil } = useQuery({
    queryKey: ['usuario-perfil'],
    queryFn: () => api.get('/usuarios/perfil').then((r) => r.data),
  })

  const { data: tenant } = useQuery({
    queryKey: ['tenant-me'],
    queryFn: () => api.get('/tenants/meu').then((r) => r.data),
    enabled: !!usuario?.tenantId,
  })

  useEffect(() => {
    if (perfil) {
      setPerfilForm({
        nome: perfil.nome || '',
        email: perfil.email || '',
        oab: perfil.oab || '',
        telefone: perfil.telefone || '',
      })
    }
  }, [perfil])

  useEffect(() => {
    if (tenant) {
      setEscritorioForm({
        nome: tenant.nome || '',
        telefone: tenant.telefone || '',
        endereco: tenant.endereco || '',
      })
    }
  }, [tenant])

  const salvarPerfil = useMutation({
    mutationFn: () =>
      api.put('/usuarios/perfil', {
        nome: perfilForm.nome,
        oab: perfilForm.oab,
        telefone: perfilForm.telefone,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuario-perfil'] })
      toast({ title: 'Perfil atualizado com sucesso' })
    },
    onError: () => {
      toast({ variant: 'destructive', title: 'Erro ao atualizar perfil' })
    },
  })

  const salvarEscritorio = useMutation({
    mutationFn: () => api.put('/tenants/meu', escritorioForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-me'] })
      toast({ title: 'Dados do escritório atualizados' })
    },
    onError: () => {
      toast({ variant: 'destructive', title: 'Erro ao atualizar escritório' })
    },
  })

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Settings className="w-6 h-6" />Configurações</h1>
        <p className="text-muted-foreground">Gerencie as configurações da sua conta e escritório</p>
      </div>

      <div className="flex gap-1 bg-muted p-1 rounded-lg w-fit">
        {[
          { id: 'perfil', label: 'Meu Perfil', icon: User },
          { id: 'escritorio', label: 'Escritório', icon: Building2 },
          { id: 'seguranca', label: 'Segurança', icon: Shield },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'perfil' && (
        <Card>
          <CardHeader><CardTitle className="text-base">Informações Pessoais</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white text-2xl font-bold">
                {usuario?.nome?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <p className="font-semibold">{perfilForm.nome || usuario?.nome}</p>
                <p className="text-sm text-muted-foreground">{perfilForm.email || usuario?.email}</p>
                <p className="text-xs text-primary mt-1 capitalize">{usuario?.role?.replace('_', ' ')}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Nome</label>
                <Input value={perfilForm.nome} onChange={(e) => setPerfilForm((f) => ({ ...f, nome: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Email</label>
                <Input value={perfilForm.email} disabled />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">OAB</label>
                <Input value={perfilForm.oab} onChange={(e) => setPerfilForm((f) => ({ ...f, oab: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Telefone</label>
                <Input value={perfilForm.telefone} onChange={(e) => setPerfilForm((f) => ({ ...f, telefone: e.target.value }))} />
              </div>
            </div>

            <Button onClick={() => salvarPerfil.mutate()} disabled={salvarPerfil.isPending}>
              Salvar alterações
            </Button>
          </CardContent>
        </Card>
      )}

      {activeTab === 'escritorio' && (
        <Card>
          <CardHeader><CardTitle className="text-base">Dados do Escritório</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {tenant ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Nome do escritório</label>
                    <Input value={escritorioForm.nome} onChange={(e) => setEscritorioForm((f) => ({ ...f, nome: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">CNPJ</label>
                    <Input defaultValue={tenant.cnpj || ''} disabled />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Email</label>
                    <Input defaultValue={tenant.email} disabled />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Telefone</label>
                    <Input value={escritorioForm.telefone} onChange={(e) => setEscritorioForm((f) => ({ ...f, telefone: e.target.value }))} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-sm font-medium mb-1.5 block">Endereço</label>
                    <Input value={escritorioForm.endereco} onChange={(e) => setEscritorioForm((f) => ({ ...f, endereco: e.target.value }))} />
                  </div>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium">Plano atual: <span className="text-primary">{tenant.plano?.nome}</span></p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {tenant._count?.usuarios} usuários • {tenant._count?.processos} processos • {tenant._count?.clientes} clientes
                  </p>
                </div>

                <Button onClick={() => salvarEscritorio.mutate()} disabled={salvarEscritorio.isPending}>
                  Salvar alterações
                </Button>
              </>
            ) : (
              <p className="text-muted-foreground">Carregando dados do escritório...</p>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'seguranca' && (
        <Card>
          <CardHeader><CardTitle className="text-base">Segurança da Conta</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Senha atual</label>
              <Input type="password" placeholder="••••••••" value={senhaForm.atual} onChange={(e) => setSenhaForm((f) => ({ ...f, atual: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Nova senha</label>
              <Input type="password" placeholder="••••••••" value={senhaForm.nova} onChange={(e) => setSenhaForm((f) => ({ ...f, nova: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Confirmar nova senha</label>
              <Input type="password" placeholder="••••••••" value={senhaForm.confirmar} onChange={(e) => setSenhaForm((f) => ({ ...f, confirmar: e.target.value }))} />
            </div>

            <Button
              onClick={() => {
                if (!senhaForm.atual || !senhaForm.nova) {
                  toast({ variant: 'destructive', title: 'Preencha a senha atual e a nova senha' })
                  return
                }
                if (senhaForm.nova !== senhaForm.confirmar) {
                  toast({ variant: 'destructive', title: 'A confirmação da senha não confere' })
                  return
                }
                toast({ title: 'Fluxo de troca de senha ainda depende do backend' })
              }}
            >
              Alterar senha
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}