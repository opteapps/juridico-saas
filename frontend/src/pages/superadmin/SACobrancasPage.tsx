import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { formatarData, formatarMoeda } from '@/lib/utils'

export function SACobrancasPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['sa-cobrancas'],
    queryFn: () => api.get('/super-admin/assinaturas').then((r) => r.data),
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
            ) : data?.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">Nenhuma assinatura encontrada</td></tr>
            ) : data?.map((item: any) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">{item.tenant?.nome}</td>
                <td className="px-6 py-4">{item.plano?.nome}</td>
                <td className="px-6 py-4">{formatarMoeda(Number(item.plano?.preco || 0))}</td>
                <td className="px-6 py-4">{formatarData(item.inicioEm)}</td>
                <td className="px-6 py-4 capitalize">{item.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}