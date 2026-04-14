import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { formatarMoeda } from '@/lib/utils'
import { Check } from 'lucide-react'

export function SAPlanosPage() {
  const { data } = useQuery({
    queryKey: ['sa-planos'],
    queryFn: () => api.get('/super-admin/planos').then((r) => r.data),
  })

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Planos</h1>
        <p className="text-gray-500 mt-1">Configure os planos de assinatura disponíveis</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {data?.map((plano: any) => (
          <div key={plano.id} className="bg-white rounded-xl border p-6 shadow-sm">
            <h2 className="text-lg font-semibold">{plano.nome}</h2>
            <p className="text-3xl font-bold mt-4">{formatarMoeda(plano.preco)}<span className="text-sm font-normal text-gray-500">/mês</span></p>
            <ul className="space-y-2 mt-6 text-sm text-gray-600">
              <li className="flex gap-2"><Check className="h-4 w-4 text-green-500 mt-0.5" />{plano.maxUsuarios} usuários</li>
              <li className="flex gap-2"><Check className="h-4 w-4 text-green-500 mt-0.5" />{plano.maxProcessos === 999999 ? 'Ilimitados' : plano.maxProcessos} processos</li>
              <li className="flex gap-2"><Check className="h-4 w-4 text-green-500 mt-0.5" />{plano.maxStorageMb} MB de storage</li>
              <li className="flex gap-2"><Check className="h-4 w-4 text-green-500 mt-0.5" />Assistente IA: {plano.temIA ? 'Sim' : 'Não'}</li>
              <li className="flex gap-2"><Check className="h-4 w-4 text-green-500 mt-0.5" />Portal do cliente: {plano.temPortalCliente ? 'Sim' : 'Não'}</li>
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}