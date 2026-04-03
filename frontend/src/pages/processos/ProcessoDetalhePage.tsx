import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatarNumeroCNJ, formatarData, formatarMoeda, STATUS_PROCESSO } from '@/lib/utils'
import { ArrowLeft, Scale, Users, Calendar, FileText, AlertTriangle, Edit } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ProcessoDetalhePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: processo, isLoading } = useQuery({
    queryKey: ['processo', id],
    queryFn: () => api.get(`/processos/${id}`).then(r => r.data),
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
      {/* Header */}
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
              {processo.tribunal && `${processo.tribunal} • `}{processo.vara || 'Sem vara definida'}
            </p>
          </div>
        </div>
        <Button variant="outline">
          <Edit className="w-4 h-4" /> Editar
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Details card */}
          <Card>
            <CardHeader><CardTitle className="text-base">Informações do Processo</CardTitle></CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Área', value: processo.area },
                  { label: 'Assunto', value: processo.assunto },
                  { label: 'Juiz', value: processo.juiz },
                  { label: 'Fórum', value: processo.forum },
                  { label: 'Valor da Causa', value: processo.valorCausa ? formatarMoeda(Number(processo.valorCausa)) : null },
                  { label: 'Distribuição', value: processo.dataDistribuicao ? formatarData(processo.dataDistribuicao) : null },
                ].map(item => item.value ? (
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

          {/* Movimentações */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Últimas Movimentações</CardTitle>
              <Button variant="ghost" size="sm">Ver todas</Button>
            </CardHeader>
            <CardContent>
              {processo.movimentacoes?.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">Nenhuma movimentação registrada</p>
              ) : (
                <div className="space-y-3">
                  {processo.movimentacoes?.map((m: any) => (
                    <div key={m.id} className="flex gap-3 p-3 rounded-lg bg-muted/30">
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
                            {m.tipo || 'Movimentação'}
                          </span>
                          <span className="text-xs text-muted-foreground">{formatarData(m.data)}</span>
                        </div>
                        <p className="text-sm mt-1.5 leading-relaxed">{m.descricao}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Prazos */}
          {processo.prazos?.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Prazos Pendentes</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {processo.prazos.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="text-sm font-medium">{p.titulo}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{p.descricao}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-destructive">{formatarData(p.dataVencimento)}</p>
                        <p className="text-xs text-muted-foreground capitalize">{p.tipo}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Clients */}
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

          {/* Lawyers */}
          <Card>
            <CardHeader><CardTitle className="text-base">Advogados</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {processo.advogados?.map((ap: any) => (
                  <div key={ap.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                      {ap.usuario.nome.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{ap.usuario.nome}</p>
                      {ap.principal && <p className="text-xs text-primary">Responsável</p>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
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
