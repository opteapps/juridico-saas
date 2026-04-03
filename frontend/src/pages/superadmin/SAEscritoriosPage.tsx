import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { formatarData } from '@/lib/utils'
import { Search, Eye, Power, Users, FileText } from 'lucide-react'
import { Link } from 'react-router-dom'

export function SAEscritoriosPage() {
  const [busca, setBusca] = useState('')
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['sa-tenants', busca],
    queryFn: () => api.get('/super-admin/tenants', { params: { busca } }).then(r => r.data),
  })

  const suspender = useMutation({
    mutationFn: ({ id, ativo }: { id: string; ativo: boolean }) =>
      api.patch(`/super-admin/tenants/${id}/status`, { ativo }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sa-tenants'] }),
  })

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Escritórios Cadastrados</h1>
          <p className="text-gray-500 mt-1">Gerencie todos os escritórios do sistema</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          className="w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Buscar por nome, CNPJ ou email..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-6 py-3 text-gray-600 font-medium">Escritório</th>
              <th className="text-left px-6 py-3 text-gray-600 font-medium">Plano</th>
              <th className="text-left px-6 py-3 text-gray-600 font-medium">Usuários / Processos</th>
              <th className="text-left px-6 py-3 text-gray-600 font-medium">Cadastro</th>
              <th className="text-left px-6 py-3 text-gray-600 font-medium">Status</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">Carregando...</td></tr>
            ) : data?.tenants?.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">Nenhum escritório encontrado</td></tr>
            ) : data?.tenants?.map((t: any) => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <p className="font-medium text-gray-900">{t.nome}</p>
                  <p className="text-gray-400 text-xs">{t.email}</p>
                  {t.cnpj && <p className="text-gray-400 text-xs">{t.cnpj}</p>}
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full font-medium">
                    {t.plano?.nome}
                  </span>
                  <p className="text-gray-400 text-xs mt-1">R$ {t.plano?.preco}/mês</p>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3 text-gray-600">
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" />{t._count?.usuarios}</span>
                    <span className="flex items-center gap-1"><FileText className="h-3 w-3" />{t._count?.processos}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-500">{formatarData(t.criadoEm)}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${t.ativo ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {t.ativo ? 'Ativo' : 'Suspenso'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Link to={`/super-admin/escritorios/${t.id}`} className="p-1.5 hover:bg-gray-100 rounded" title="Ver detalhes">
                      <Eye className="h-4 w-4 text-gray-500" />
                    </Link>
                    <button
                      onClick={() => suspender.mutate({ id: t.id, ativo: !t.ativo })}
                      className={`p-1.5 hover:bg-gray-100 rounded ${t.ativo ? 'text-red-500' : 'text-green-500'}`}
                      title={t.ativo ? 'Suspender' : 'Reativar'}
                    >
                      <Power className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
