import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, Users, Eye, Building2, User } from 'lucide-react'

export function ClientesPage() {
  const [busca, setBusca] = useState('')
  const [page, setPage] = useState(1)
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['clientes', busca, page],
    queryFn: () => api.get('/clientes', { params: { busca, page, limit: 20 } }).then(r => r.data),
    placeholderData: (prev) => prev,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="text-muted-foreground">Gerencie os clientes do escritório</p>
        </div>
        <Button onClick={() => navigate('/clientes/novo')}>
          <Plus className="w-4 h-4" /> Novo Cliente
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, CPF/CNPJ, email..."
              className="pl-9"
              value={busca}
              onChange={e => { setBusca(e.target.value); setPage(1) }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Carregando...</div>
          ) : data?.clientes?.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground font-medium">Nenhum cliente encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Cliente</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">CPF/CNPJ</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Contato</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Processos</th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data?.clientes?.map((c: any) => (
                    <tr key={c.id} className="hover:bg-muted/20 cursor-pointer" onClick={() => navigate(`/clientes/${c.id}`)}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                            {c.tipo === 'pessoa_juridica' ? <Building2 className="w-4 h-4" /> : c.nome.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{c.nome}</p>
                            <p className="text-xs text-muted-foreground capitalize">{c.tipo.replace('_', ' ')}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">{c.cpfCnpj || '—'}</td>
                      <td className="px-6 py-4 text-sm">
                        <p>{c.email || '—'}</p>
                        {c.telefone && <p className="text-xs text-muted-foreground">{c.telefone}</p>}
                      </td>
                      <td className="px-6 py-4 text-sm">{c._count?.processos ?? 0}</td>
                      <td className="px-6 py-4">
                        <Button variant="ghost" size="icon">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {data?.pages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Anterior</Button>
          <span className="flex items-center text-sm text-muted-foreground">Página {page} de {data.pages}</span>
          <Button variant="outline" size="sm" disabled={page >= data.pages} onClick={() => setPage(p => p + 1)}>Próxima</Button>
        </div>
      )}
    </div>
  )
}
