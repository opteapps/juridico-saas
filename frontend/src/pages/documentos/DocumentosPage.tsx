import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatarData } from '@/lib/utils'
import { Download, FileText, Plus, Trash2, Upload, Loader2 } from 'lucide-react'

type UploadFormState = {
  tipo: string
  processoId: string
  clienteId: string
  descricao: string
}

const initialUploadForm: UploadFormState = {
  tipo: 'outros',
  processoId: '',
  clienteId: '',
  descricao: '',
}

export function DocumentosPage() {
  const [processoId, setProcessoId] = useState('')
  const [clienteId, setClienteId] = useState('')
  const [tipo, setTipo] = useState('')
  const [showUpload, setShowUpload] = useState(false)
  const [uploadForm, setUploadForm] = useState<UploadFormState>(initialUploadForm)
  const [arquivo, setArquivo] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['documentos', processoId, clienteId, tipo],
    queryFn: () => api.get('/documentos', { params: { processoId, clienteId, tipo, limit: 50 } }).then((r) => r.data),
  })

  const { data: processos } = useQuery({
    queryKey: ['documentos-processos-select'],
    queryFn: () => api.get('/processos', { params: { limit: 100 } }).then((r) => r.data?.processos ?? []),
  })

  const { data: clientes } = useQuery({
    queryKey: ['documentos-clientes-select'],
    queryFn: () => api.get('/clientes', { params: { limit: 100 } }).then((r) => r.data?.clientes ?? []),
  })

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!arquivo) throw new Error('Selecione um arquivo')
      const formData = new FormData()
      formData.append('file', arquivo)
      formData.append('tipo', uploadForm.tipo)
      if (uploadForm.processoId) formData.append('processoId', uploadForm.processoId)
      if (uploadForm.clienteId) formData.append('clienteId', uploadForm.clienteId)
      if (uploadForm.descricao) formData.append('descricao', uploadForm.descricao)
      return api.post('/documentos/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentos'] })
      setShowUpload(false)
      setUploadForm(initialUploadForm)
      setArquivo(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    },
  })

  const excluirMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/documentos/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentos'] })
    },
  })

  const tipoIcons: Record<string, string> = {
    peticao: '📄',
    contrato: '📋',
    prova: '🔍',
    decisao: '⚖️',
    outros: '📁',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Documentos</h1>
          <p className="text-muted-foreground">Repositório de documentos do escritório</p>
        </div>
        <Button onClick={() => { setUploadForm({ ...initialUploadForm, processoId, clienteId }); setShowUpload(true) }}>
          <Plus className="w-4 h-4" /> Enviar Documento
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Filtros</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <Label>Processo</Label>
              <select className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={processoId} onChange={(e) => setProcessoId(e.target.value)}>
                <option value="">Todos</option>
                {processos?.map((processo: any) => (
                  <option key={processo.id} value={processo.id}>{processo.numeroFormatado || processo.numero}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Cliente</Label>
              <select className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
                <option value="">Todos</option>
                {clientes?.map((cliente: any) => (
                  <option key={cliente.id} value={cliente.id}>{cliente.nome}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Tipo</Label>
              <select className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={tipo} onChange={(e) => setTipo(e.target.value)}>
                <option value="">Todos</option>
                <option value="peticao">Petição</option>
                <option value="contrato">Contrato</option>
                <option value="prova">Prova</option>
                <option value="decisao">Decisão</option>
                <option value="outros">Outros</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Carregando...</div>
          ) : !data?.length ? (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground font-medium">Nenhum documento encontrado</p>
              <p className="text-muted-foreground text-sm mt-1">Envie o primeiro documento para começar</p>
            </div>
          ) : (
            <table className="w-full">
              <thead><tr className="border-b bg-muted/30">
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Nome</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Tipo</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Vínculo</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Enviado por</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase">Data</th>
                <th className="px-6 py-3" />
              </tr></thead>
              <tbody className="divide-y">
                {data.map((documento: any) => (
                  <tr key={documento.id} className="hover:bg-muted/20">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{tipoIcons[documento.tipo] || '📁'}</span>
                        <div>
                          <p className="text-sm font-medium">{documento.nome}</p>
                          {documento.descricao && <p className="text-xs text-muted-foreground">{documento.descricao}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm capitalize">{documento.tipo || '—'}</td>
                    <td className="px-6 py-4 text-sm">{documento.processo?.numero || documento.cliente?.nome || 'Geral'}</td>
                    <td className="px-6 py-4 text-sm">{documento.usuario?.nome || '—'}</td>
                    <td className="px-6 py-4 text-sm">{formatarData(documento.criadoEm)}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={async () => {
                          try {
                            const { data } = await api.get(`/documentos/${documento.id}/download`)
                            if (data?.url) window.open(data.url, '_blank', 'noopener,noreferrer')
                          } catch {
                            window.alert('Não foi possível gerar o link de download.')
                          }
                        }}>
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => {
                          const confirmado = window.confirm(`Deseja excluir o documento "${documento.nome}"?`)
                          if (confirmado) excluirMutation.mutate(documento.id)
                        }}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar documento</DialogTitle>
            <DialogDescription>Selecione um arquivo e vincule-o opcionalmente a um processo ou cliente.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="arquivo">Arquivo</Label>
              <Input id="arquivo" ref={fileInputRef} type="file" onChange={(e) => setArquivo(e.target.files?.[0] || null)} />
            </div>
            <div>
              <Label>Tipo</Label>
              <select className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={uploadForm.tipo} onChange={(e) => setUploadForm((f) => ({ ...f, tipo: e.target.value }))}>
                <option value="peticao">Petição</option>
                <option value="contrato">Contrato</option>
                <option value="prova">Prova</option>
                <option value="decisao">Decisão</option>
                <option value="outros">Outros</option>
              </select>
            </div>
            <div>
              <Label>Processo</Label>
              <select className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={uploadForm.processoId} onChange={(e) => setUploadForm((f) => ({ ...f, processoId: e.target.value }))}>
                <option value="">Nenhum</option>
                {processos?.map((processo: any) => (
                  <option key={processo.id} value={processo.id}>{processo.numeroFormatado || processo.numero}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Cliente</Label>
              <select className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={uploadForm.clienteId} onChange={(e) => setUploadForm((f) => ({ ...f, clienteId: e.target.value }))}>
                <option value="">Nenhum</option>
                {clientes?.map((cliente: any) => (
                  <option key={cliente.id} value={cliente.id}>{cliente.nome}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Descrição</Label>
              <Input value={uploadForm.descricao} onChange={(e) => setUploadForm((f) => ({ ...f, descricao: e.target.value }))} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpload(false)}>Cancelar</Button>
            <Button onClick={() => uploadMutation.mutate()} disabled={uploadMutation.isPending || !arquivo}>
              {uploadMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}