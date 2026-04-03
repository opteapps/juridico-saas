import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { formatarDataHora } from '@/lib/utils'
import { Filter } from 'lucide-react'

const ACOES = ['LOGIN', 'CREATE', 'UPDATE', 'DELETE', 'LGPD_ACESSO', 'LGPD_EXCLUSAO']

export function SAAuditoriaPage() {
  const [acao, setAcao] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['sa-auditoria', acao, page],
    queryFn: () => api.get('/super-admin/auditoria', { params: { acao, page } }).then(r => r.data),
  })

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Auditoria do Sistema</h1>
        <p className="text-gray-500 mt-1">Registro completo de todas as ações realizadas no sistema</p>
      </div>

      <div className="flex gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Filter className="h-4 w-4" />
          <span>Filtrar por ação:</span>
        </div>
        <select
          className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={acao}
          onChange={(e) => { setAcao(e.target.value); setPage(1) }}
        >
          <option value="">Todas as ações</option>
          {ACOES.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-6 py-3 text-gray-600 font-medium">Data/Hora</th>
              <th className="text-left px-6 py-3 text-gray-600 font-medium">Ação</th>
              <th className="text-left px-6 py-3 text-gray-600 font-medium">Usuário</th>
              <th className="text-left px-6 py-3 text-gray-600 font-medium">Escritório</th>
              <th className="text-left px-6 py-3 text-gray-600 font-medium">Entidade</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">Carregando...</td></tr>
            ) : data?.logs?.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">Nenhum registro encontrado</td></tr>
            ) : data?.logs?.map((log: any) => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-6 py-3 text-gray-500 text-xs">{formatarDataHora(log.criadoEm)}</td>
                <td className="px-6 py-3">
                  <span className={`px-2 py-0.5 text-xs rounded font-medium font-mono ${
                    log.acao === 'LOGIN' ? 'bg-blue-50 text-blue-700' :
                    log.acao === 'DELETE' ? 'bg-red-50 text-red-700' :
                    log.acao.startsWith('LGPD') ? 'bg-purple-50 text-purple-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {log.acao}
                  </span>
                </td>
                <td className="px-6 py-3">
                  <p className="font-medium text-gray-900">{log.usuario?.nome || '—'}</p>
                  <p className="text-gray-400 text-xs">{log.usuario?.email}</p>
                </td>
                <td className="px-6 py-3 text-gray-600">{log.tenant?.nome || '—'}</td>
                <td className="px-6 py-3 text-gray-500">{log.entidade} {log.entidadeId ? `#${log.entidadeId.slice(0,8)}` : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {data?.total > 50 && (
          <div className="px-6 py-3 border-t flex justify-between items-center text-sm">
            <span className="text-gray-500">{data.total} registros</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="px-3 py-1 border rounded disabled:opacity-40">Anterior</button>
              <button onClick={() => setPage(p => p+1)} disabled={page * 50 >= data.total} className="px-3 py-1 border rounded disabled:opacity-40">Próxima</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
