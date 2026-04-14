import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { useAuthStore } from '@/store/auth'
import { Plus, Users, X, Loader2 } from 'lucide-react'
import { AREAS_ATUACAO, ROLES } from '@/lib/utils'

export function UsuariosPage() {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ nome: '', email: '', senha: '', role: 'advogado', oab: '' })
  const { toast } = useToast()
  const { usuario } = useAuthStore()
  const queryClient = useQueryClient()

  const { data: usuarios, isLoading } = useQuery({
    queryKey: ['usuarios'],
    queryFn: () => api.get('/usuarios').then(r => r.data),
  })

  const mutation = useMutation({
    mutationFn: (d: typeof form) => api.post('/usuarios', d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] })
      toast({ title: 'Usuário criado!' })
      setShowForm(false)
    },
    onError: (err: any) => toast({ variant: 'destructive', title: 'Erro', description: err.response?.data?.error }),
  })

  const canManage = usuario?.role === 'admin_escritorio' || usuario?.role === 'super_admin'

  const roleColors: Record<string, string> = {
    admin_escritorio: 'bg-purple-100 text-purple-800',
    advogado: 'bg-blue-100 text-blue-800',
    estagiario: 'bg-cyan-100 text-cyan-800',
    financeiro: 'bg-green-100 text-green-800',
    secretaria: 'bg-yellow-100 text-yellow-800',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Usuários</h1>
          <p className="text-muted-foreground">Gerencie os membros da equipe</p>
        </div>
        {canManage && <Button onClick={() => setShowForm(!showForm)}><Plus className="w-4 h-4" /> Novo Usuário</Button>}
      </div>

      {showForm && canManage && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Novo Usuário</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}><X className="w-4 h-4" /></Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Nome *</label>
                <Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Email *</label>
                <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Senha *</label>
                <Input type="password" value={form.senha} onChange={e => setForm(f => ({ ...f, senha: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Perfil</label>
                <select className="h-10 w-full px-3 rounded-md border border-input bg-background text-sm"
                  value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  <option value="advogado">Advogado</option>
                  <option value="estagiario">Estagiário</option>
                  <option value="financeiro">Financeiro</option>
                  <option value="secretaria">Secretária</option>
                  <option value="admin_escritorio">Administrador</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">OAB</label>
                <Input placeholder="SP 123456" value={form.oab} onChange={e => setForm(f => ({ ...f, oab: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button onClick={() => mutation.mutate(form)} disabled={mutation.isPending || !form.nome || !form.email || !form.senha}>
                {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />} Criar Usuário
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Carregando...</div>
          ) : !usuarios?.length ? (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground">Nenhum usuário encontrado</p>
            </div>
          ) : (
            <table className="w-full">
              <thead><tr className="border-b bg-muted/30">
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Usuário</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Perfil</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">OAB</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Status</th>
              </tr></thead>
              <tbody className="divide-y">
                {usuarios?.map((u: any) => (
                  <tr key={u.id} className="hover:bg-muted/20">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                          {u.nome.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{u.nome}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColors[u.role] || 'bg-gray-100 text-gray-800'}`}>
                        {ROLES[u.role as keyof typeof ROLES] || u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">{u.oab || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {u.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
