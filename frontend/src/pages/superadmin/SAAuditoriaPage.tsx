import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { formatarDataHora } from '@/lib/utils'

const ACOES = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN']

export function SAAuditoriaPage() {
  const [acao, setAcao] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['sa-auditoria', acao, page],
    queryFn: () => api.get('/super-admin/auditoria', { params: { acao, page, limit: 50 } }).then((r) => r.data),
  })

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Auditoria</h1>
        <p className="text-gray-500 mt-1">Registro completo de todas as ações realizadas no sistema</p>
      </div>

      <div className="flex items-center gap-3">
        <span>Filtrar por ação:</span>
        <select className="border rounded px-3 py-2 text-sm" value={acao} onChange={(e) => setAcao(e.target.value)}>
          <option value="">Todas as ações</option>
          {ACOES.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-6 py-3 text-gray-600 font-medium">Ação</th>
              <th className="text-left px-6 py-3 text-gray-600 font-medium">Usuário</th>
              <th className="text-left px-6 py-3 text-gray-600 font-medium">Escritório</th>
              <th className="text-left px-6 py-3 text-gray-600 font-medium">Entidade</th>
              <th className="text-left px-6 py-3 text-gray-600 font-medium">Data</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">Carregando...</td></tr>
            ) : data?.logs?.map((log: any) => (
              <tr key={log.id}>
                <td className="px-6 py-3">{log.acao}</td>
                <td className="px-6 py-3">
                  <p className="font-medium text-gray-900">{log.usuario?.nome || '—'}</p>
                  <p className="text-gray-400 text-xs">{log.usuario?.email}</p>
                </td>
                <td className="px-6 py-3 text-gray-600">{log.tenant?.nome || '—'}</td>
                <td className="px-6 py-3 text-gray-500">{log.entidade} {log.entidadeId ? `#${log.entidadeId.slice(0, 8)}` : ''}</td>
                <td className="px-6 py-3 text-gray-500">{formatarDataHora(log.criadoEm)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end gap-2">
        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border rounded disabled:opacity-40">Anterior</button>
        <button onClick={() => setPage((p) => p + 1)} disabled={page * 50 >= (data?.total || 0)} className="px-3 py-1 border rounded disabled:opacity-40">Próxima</button>
      </div>
    </div>
  )
}