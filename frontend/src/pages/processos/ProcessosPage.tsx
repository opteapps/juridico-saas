import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatarNumeroCNJ, STATUS_PROCESSO } from '@/lib/utils'
import { Plus, Search, Scale, Eye, MoreVertical, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ProcessosPage() {
  const [busca, setBusca] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['processos', busca, status, page],
    queryFn: () => api.get('/processos', { params: { busca, status, page, limit: 20 } }).then(r => r.data),
    placeholderData: (prev) => prev,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Processos</h1>
          <p className="text-muted-foreground">Gerencie todos os processos do escritório</p>
        </div>
        <Button onClick={() => navigate('/processos/novo')}>
          <Plus className="w-4 h-4" />
          Novo Processo
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por número, assunto, vara..."
                className="pl-9"
                value={busca}
                onChange={e => { setBusca(e.target.value); setPage(1) }}
              />
            </div>
            <select
              className="h-10 px-3 rounded-md border border-input bg-background text-sm"
              value={status}
              onChange={e => { setStatus(e.target.value); setPage(1) }}
            >
              <option value="">Todos os status</option>
              <option value="ativo">Ativo</option>
              <option value="suspenso">Suspenso</option>
              <option value="encerrado">Encerrado</option>
              <option value="arquivado">Arquivado</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Carregando...</div>
          ) : data?.processos?.length === 0 ? (
            <div className="p-12 text-center">
              <Scale className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground font-medium">Nenhum processo encontrado</p>
              <p className="text-muted-foreground text-sm mt-1">Clique em "Novo Processo" para começar</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Número</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Área</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Clientes</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Advogados</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Status</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Movimentações</th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data?.processos?.map((p: any) => (
                    <tr key={p.id} className="hover:bg-muted/20 cursor-pointer" onClick={() => navigate(`/processos/${p.id}`)}>
                      <td className="px-6 py-4">
                        <p className="font-mono text-sm font-medium">{p.numeroFormatado || formatarNumeroCNJ(p.numero)}</p>
                        {p.tribunal && <p className="text-xs text-muted-foreground mt-0.5">{p.tribunal} • {p.vara || 'Sem vara'}</p>}
                      </td>
                      <td className="px-6 py-4 text-sm">{p.area || '—'}</td>
                      <td className="px-6 py-4 text-sm">
                        {p.clientes?.slice(0,2).map((c: any) => c.cliente.nome).join(', ') || '—'}
                        {p.clientes?.length > 2 && ` +${p.clientes.length - 2}`}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {p.advogados?.slice(0,2).map((a: any) => a.usuario.nome).join(', ') || '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', STATUS_PROCESSO[p.status as keyof typeof STATUS_PROCESSO]?.color || 'bg-gray-100 text-gray-800')}>
                          {STATUS_PROCESSO[p.status as keyof typeof STATUS_PROCESSO]?.label || p.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{p._count?.movimentacoes ?? 0}</td>
                      <td className="px-6 py-4">
                        <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); navigate(`/processos/${p.id}`) }}>
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

      {/* Pagination */}
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
