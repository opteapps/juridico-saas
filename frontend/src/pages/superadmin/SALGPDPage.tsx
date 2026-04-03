import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { ShieldCheck } from 'lucide-react'

export function SALGPDPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['sa-lgpd'],
    queryFn: () => api.get('/super-admin/lgpd/solicitacoes').then(r => r.data),
  })

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">LGPD e Privacidade</h1>
        <p className="text-gray-500 mt-1">Solicitações de titulares de dados e conformidade com a LGPD</p>
      </div>

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
        <ShieldCheck className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-semibold mb-1">Lei Geral de Proteção de Dados (LGPD — Lei 13.709/2018)</p>
          <p>O sistema registra automaticamente todas as solicitações de acesso, exclusão e portabilidade de dados pessoais realizadas pelos titulares.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Solicitações de Acesso', type: 'LGPD_ACESSO' },
          { label: 'Solicitações de Exclusão', type: 'LGPD_EXCLUSAO' },
          { label: 'Portabilidade de Dados', type: 'LGPD_PORTABILIDADE' },
        ].map(item => {
          const count = data?.filter((d: any) => d.acao === item.type).length || 0
          return (
            <div key={item.type} className="bg-white rounded-xl border p-5 shadow-sm">
              <p className="text-2xl font-bold text-gray-900">{count}</p>
              <p className="text-sm text-gray-500 mt-1">{item.label}</p>
            </div>
          )
        })}
      </div>

      {!isLoading && data?.length === 0 && (
        <div className="bg-white rounded-xl border p-12 text-center">
          <ShieldCheck className="h-10 w-10 text-green-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">Nenhuma solicitação LGPD registrada</p>
          <p className="text-gray-400 text-sm">As solicitações dos titulares aparecerão aqui</p>
        </div>
      )}
    </div>
  )
}
