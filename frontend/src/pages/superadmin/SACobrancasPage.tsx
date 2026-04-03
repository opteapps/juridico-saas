import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { formatarData, formatarMoeda } from '@/lib/utils'

export function SACobrancasPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['sa-cobrancas'],
    queryFn: () => api.get('/super-admin/cobrancas').then(r => r.data),
  })

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Planos e Cobranças</h1>
        <p className="text-gray-500 mt-1">Gerencie assinaturas e pagamentos dos escritórios</p>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-6 py-3 text-gray-600 font-medium">Escritório</th>
              <th className="text-left px-6 py-3 text-gray-600 font-medium">Plano</th>
              <th className="text-left px-6 py-3 text-gray-600 font-medium">Valor/mês</th>
              <th className="text-left px-6 py-3 text-gray-600 font-medium">Início</th>
              <th className="text-left px-6 py-3 text-gray-600 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">Carregando...</td></tr>
            ) : data?.map((a: any) => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <p className="font-medium">{a.tenant?.nome}</p>
                  <p className="text-gray-400 text-xs">{a.tenant?.email}</p>
                </td>
                <td className="px-6 py-4 text-gray-700">{a.plano?.nome}</td>
                <td className="px-6 py-4 font-semibold text-green-700">{formatarMoeda(a.plano?.preco)}</td>
                <td className="px-6 py-4 text-gray-500">{formatarData(a.inicioEm)}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                    a.status === 'ativa' ? 'bg-green-50 text-green-700' :
                    a.status === 'suspensa' ? 'bg-yellow-50 text-yellow-700' :
                    'bg-red-50 text-red-700'
                  }`}>
                    {a.status === 'ativa' ? 'Ativa' : a.status === 'suspensa' ? 'Suspensa' : 'Cancelada'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
