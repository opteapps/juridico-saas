import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatarData } from '@/lib/utils'
import { FileText, Plus, Download } from 'lucide-react'

export function DocumentosPage() {
  const [processoId, setProcessoId] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['documentos', processoId],
    queryFn: () => api.get('/documentos', { params: { processoId, limit: 50 } }).then(r => r.data),
  })

  const tipoIcons: Record<string, string> = {
    peticao: '📄', contrato: '📋', prova: '🔍', decisao: '⚖️', outros: '📁',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Documentos</h1>
          <p className="text-muted-foreground">Repositório de documentos do escritório</p>
        </div>
        <Button><Plus className="w-4 h-4" /> Enviar Documento</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Carregando...</div>
          ) : data?.documentos?.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground font-medium">Nenhum documento encontrado</p>
              <p className="text-muted-foreground text-sm mt-1">Faça upload do primeiro documento</p>
            </div>
          ) : (
            <table className="w-full">
              <thead><tr className="border-b bg-muted/30">
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Nome</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Tipo</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Processo</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Enviado por</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Data</th>
                <th className="px-6 py-3" />
              </tr></thead>
              <tbody className="divide-y">
                {data?.documentos?.map((d: any) => (
                  <tr key={d.id} className="hover:bg-muted/20">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{tipoIcons[d.tipo] || '📁'}</span>
                        <p className="text-sm font-medium">{d.nome}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm capitalize">{d.tipo || '—'}</td>
                    <td className="px-6 py-4 text-sm">{d.processo?.numero || '—'}</td>
                    <td className="px-6 py-4 text-sm">{d.usuario?.nome || '—'}</td>
                    <td className="px-6 py-4 text-sm">{formatarData(d.criadoEm)}</td>
                    <td className="px-6 py-4">
                      <Button variant="ghost" size="icon"><Download className="w-4 h-4" /></Button>
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
