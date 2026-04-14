import { useParams, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatarNumeroCNJ, formatarData, formatarMoeda, STATUS_PROCESSO } from '@/lib/utils'
import { ArrowLeft, Users, AlertTriangle, Edit, Archive } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

export function ProcessoDetalhePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: processo, isLoading } = useQuery({
    queryKey: ['processo', id],
    queryFn: () => api.get(`/processos/${id}`).then((r) => r.data),
  })

  const arquivarMutation = useMutation({
    mutationFn: () => api.delete(`/processos/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['processos'] })
      toast({ title: 'Processo arquivado com sucesso' })
      navigate('/processos')
    },
    onError: () => {
      toast({ variant: 'destructive', title: 'Erro ao arquivar processo' })
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    )
  }

  if (!processo) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertTriangle className="w-12 h-12 text-muted-foreground" />
        <p className="text-muted-foreground">Processo não encontrado</p>
        <Button variant="outline" onClick={() => navigate('/processos')}>
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Button>
      </div>
    )
  }

  const statusInfo = STATUS_PROCESSO[processo.status as keyof typeof STATUS_PROCESSO]

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/processos')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold font-mono">{processo.numeroFormatado || formatarNumeroCNJ(processo.numero)}</h1>
              <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', statusInfo?.color || 'bg-gray-100 text-gray-800')}>
                {statusInfo?.label || processo.status}
              </span>
            </div>
            <p className="text-muted-foreground text-sm mt-1">
              {processo.tribunal ? `${processo.tribunal} • ` : ''}{processo.vara || 'Sem vara definida'}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/processos/${id}/editar`)}>
            <Edit className="w-4 h-4" /> Editar
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              const confirmado = window.confirm(`Deseja arquivar o processo ${processo.numeroFormatado || processo.numero}?`)
              if (confirmado) arquivarMutation.mutate()
            }}
            disabled={arquivarMutation.isPending}
          >
            <Archive className="w-4 h-4" /> Arquivar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Informações do Processo</CardTitle></CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Área', value: processo.area },
                  { label: 'Assunto', value: processo.assunto },
                  { label: 'Juiz', value: processo.juiz },
                  { label: 'Fórum', value: processo.forum },
                  { label: 'Valor da causa', value: processo.valorCausa ? formatarMoeda(Number(processo.valorCausa)) : null },
                  { label: 'Distribuição', value: processo.dataDistribuicao ? formatarData(processo.dataDistribuicao) : null },
                ].map((item) => item.value ? (
                  <div key={item.label}>
                    <dt className="text-xs text-muted-foreground font-medium uppercase">{item.label}</dt>
                    <dd className="text-sm font-medium mt-0.5">{item.value}</dd>
                  </div>
                ) : null)}
              </dl>

              {processo.descricao && (
                <div className="mt-4 pt-4 border-t">
                  <dt className="text-xs text-muted-foreground font-medium uppercase mb-1">Descrição</dt>
                  <dd className="text-sm">{processo.descricao}</dd>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Últimas movimentações</CardTitle>
              <Button variant="ghost" size="sm">Ver todas</Button>
            </CardHeader>
            <CardContent>
              {processo.movimentacoes?.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">Nenhuma movimentação registrada</p>
              ) : (
                <div className="space-y-3">
                  {processo.movimentacoes?.map((movimentacao: any) => (
                    <div key={movimentacao.id} className="flex gap-3 p-3 rounded-lg bg-muted/30">
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
                            {movimentacao.tipo || 'Movimentação'}
                          </span>
                          <span className="text-xs text-muted-foreground">{formatarData(movimentacao.data)}</span>
                        </div>
                        <p className="text-sm mt-1.5 leading-relaxed">{movimentacao.descricao}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {processo.prazos?.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Prazos pendentes</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {processo.prazos.map((prazo: any) => (
                    <div key={prazo.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="text-sm font-medium">{prazo.titulo}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{prazo.descricao}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-destructive">{formatarData(prazo.dataVencimento)}</p>
                        <p className="text-xs text-muted-foreground capitalize">{prazo.tipo}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Users className="w-4 h-4" />Partes</CardTitle></CardHeader>
            <CardContent>
              {processo.clientes?.length === 0 ? (
                <p className="text-muted-foreground text-sm">Nenhum cliente vinculado</p>
              ) : (
                <div className="space-y-2">
                  {processo.clientes?.map((cp: any) => (
                    <div key={cp.id} className="flex items-center justify-between">
                      <p className="text-sm font-medium">{cp.cliente.nome}</p>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded capitalize">{cp.polo}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Advogados</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {processo.advogados?.map((advogado: any) => (
                  <div key={advogado.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                      {advogado.usuario.nome.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{advogado.usuario.nome}</p>
                      {advogado.principal && <p className="text-xs text-primary">Responsável</p>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Estatísticas</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Movimentações</span>
                  <span className="text-sm font-semibold">{processo._count?.movimentacoes ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Documentos</span>
                  <span className="text-sm font-semibold">{processo._count?.documentos ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Monitoramento</span>
                  <span className={`text-sm font-semibold ${processo.monitoramentoAtivo ? 'text-green-600' : 'text-muted-foreground'}`}>
                    {processo.monitoramentoAtivo ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}