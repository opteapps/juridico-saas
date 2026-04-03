import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/store/auth'
import { Settings, User, Building2, Shield } from 'lucide-react'
import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function ConfiguracoesPage() {
  const { usuario } = useAuthStore()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<'perfil' | 'escritorio' | 'seguranca'>('perfil')

  const { data: tenant } = useQuery({
    queryKey: ['tenant-me'],
    queryFn: () => api.get('/tenants/me').then(r => r.data),
    enabled: !!usuario?.tenantId,
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
        ].map(tab => (
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
                <p className="font-semibold">{usuario?.nome}</p>
                <p className="text-sm text-muted-foreground">{usuario?.email}</p>
                <p className="text-xs text-primary mt-1 capitalize">{usuario?.role?.replace('_', ' ')}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Nome</label>
                <Input defaultValue={usuario?.nome || ''} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Email</label>
                <Input defaultValue={usuario?.email || ''} disabled />
              </div>
            </div>
            <Button>Salvar Alterações</Button>
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
                    <label className="text-sm font-medium mb-1.5 block">Nome do Escritório</label>
                    <Input defaultValue={tenant.nome} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">CNPJ</label>
                    <Input defaultValue={tenant.cnpj || ''} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Email</label>
                    <Input defaultValue={tenant.email} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Telefone</label>
                    <Input defaultValue={tenant.telefone || ''} />
                  </div>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium">Plano Atual: <span className="text-primary">{tenant.plano?.nome}</span></p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {tenant._count?.usuarios} usuários • {tenant._count?.processos} processos • {tenant._count?.clientes} clientes
                  </p>
                </div>
                <Button>Salvar Alterações</Button>
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
              <label className="text-sm font-medium mb-1.5 block">Senha Atual</label>
              <Input type="password" placeholder="••••••••" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Nova Senha</label>
              <Input type="password" placeholder="••••••••" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Confirmar Nova Senha</label>
              <Input type="password" placeholder="••••••••" />
            </div>
            <Button>Alterar Senha</Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
