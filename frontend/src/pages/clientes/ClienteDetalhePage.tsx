import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, User, Scale, DollarSign } from 'lucide-react'
import { formatarMoeda, formatarData } from '@/lib/utils'

export function ClienteDetalhePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: cliente, isLoading } = useQuery({
    queryKey: ['cliente', id],
    queryFn: () => api.get(`/clientes/${id}`).then(r => r.data),
  })

  if (isLoading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Carregando...</div>
  if (!cliente) return <div className="flex items-center justify-center h-64 text-muted-foreground">Cliente não encontrado</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/clientes')}><ArrowLeft className="w-5 h-5" /></Button>
        <div>
          <h1 className="text-2xl font-bold">{cliente.nome}</h1>
          <p className="text-muted-foreground capitalize">{cliente.tipo?.replace('_', ' ')} • {cliente.cpfCnpj || 'Sem CPF/CNPJ'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><User className="w-4 h-4" />Dados do Cliente</CardTitle></CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Email', value: cliente.email },
                  { label: 'Telefone', value: cliente.telefone },
                  { label: 'Celular', value: cliente.celular },
                  { label: 'Profissão', value: cliente.profissao },
                  { label: 'Cidade', value: cliente.cidade },
                  { label: 'Estado', value: cliente.estado },
                  { label: 'CEP', value: cliente.cep },
                ].map(item => item.value ? (
                  <div key={item.label}>
                    <dt className="text-xs text-muted-foreground font-medium uppercase">{item.label}</dt>
                    <dd className="text-sm font-medium mt-0.5">{item.value}</dd>
                  </div>
                ) : null)}
              </dl>
              {cliente.endereco && (
                <div className="mt-4 pt-4 border-t">
                  <dt className="text-xs text-muted-foreground font-medium uppercase mb-1">Endereço</dt>
                  <dd className="text-sm">{cliente.endereco}</dd>
                </div>
              )}
              {cliente.observacoes && (
                <div className="mt-4 pt-4 border-t">
                  <dt className="text-xs text-muted-foreground font-medium uppercase mb-1">Observações</dt>
                  <dd className="text-sm">{cliente.observacoes}</dd>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Processos */}
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Scale className="w-4 h-4" />Processos</CardTitle></CardHeader>
            <CardContent>
              {cliente.processos?.length === 0 ? (
                <p className="text-muted-foreground text-sm">Nenhum processo vinculado</p>
              ) : (
                <div className="space-y-2">
                  {cliente.processos?.map((cp: any) => (
                    <div key={cp.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/20 cursor-pointer"
                      onClick={() => navigate(`/processos/${cp.processo.id}`)}>
                      <div>
                        <p className="text-sm font-mono font-medium">{cp.processo.numero}</p>
                        <p className="text-xs text-muted-foreground">{cp.processo.area} • {cp.processo.tribunal}</p>
                      </div>
                      <span className="text-xs capitalize bg-muted px-2 py-0.5 rounded">{cp.processo.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader><CardTitle className="text-base">Resumo</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Processos</span>
                <span className="text-sm font-semibold">{cliente.processos?.length ?? 0}</span>
              </div>
              {cliente.areas?.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase mb-2">Áreas</p>
                  <div className="flex flex-wrap gap-1">
                    {cliente.areas.map((a: string) => (
                      <span key={a} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">{a}</span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
