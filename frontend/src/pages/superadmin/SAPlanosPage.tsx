import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { formatarMoeda } from '@/lib/utils'
import { Check, X } from 'lucide-react'

export function SAPlanosPage() {
  const { data: planos, isLoading } = useQuery({
    queryKey: ['sa-planos'],
    queryFn: () => api.get('/super-admin/planos').then(r => r.data),
  })

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Planos do Sistema</h1>
        <p className="text-gray-500 mt-1">Configure os planos de assinatura disponíveis</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {isLoading ? (
          [...Array(3)].map((_, i) => <div key={i} className="h-64 bg-gray-100 rounded-xl animate-pulse" />)
        ) : planos?.map((plano: any, i: number) => (
          <div key={plano.id} className={`bg-white rounded-xl border-2 p-6 shadow-sm ${i === 1 ? 'border-blue-500' : 'border-gray-200'}`}>
            {i === 1 && <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">Popular</span>}
            <h3 className="text-xl font-bold mt-2">{plano.nome}</h3>
            <p className="text-gray-500 text-sm mt-1">{plano.descricao}</p>
            <p className="text-3xl font-bold mt-4">{formatarMoeda(plano.preco)}<span className="text-sm font-normal text-gray-500">/mês</span></p>

            <ul className="mt-4 space-y-2 text-sm">
              <li className="flex gap-2"><Check className="h-4 w-4 text-green-500 mt-0.5" />{plano.maxUsuarios} usuários</li>
              <li className="flex gap-2"><Check className="h-4 w-4 text-green-500 mt-0.5" />{plano.maxProcessos === 999999 ? 'Ilimitados' : plano.maxProcessos} processos</li>
              <li className="flex gap-2"><Check className="h-4 w-4 text-green-500 mt-0.5" />{plano.maxStorageMb >= 1024 ? `${plano.maxStorageMb/1024}GB` : `${plano.maxStorageMb}MB`} de armazenamento</li>
              <li className="flex gap-2">{plano.temIA ? <Check className="h-4 w-4 text-green-500 mt-0.5" /> : <X className="h-4 w-4 text-gray-300 mt-0.5" />}Assistente IA</li>
              <li className="flex gap-2">{plano.temMonitoramento ? <Check className="h-4 w-4 text-green-500 mt-0.5" /> : <X className="h-4 w-4 text-gray-300 mt-0.5" />}Monitoramento de tribunais</li>
              <li className="flex gap-2">{plano.temPortalCliente ? <Check className="h-4 w-4 text-green-500 mt-0.5" /> : <X className="h-4 w-4 text-gray-300 mt-0.5" />}Portal do cliente</li>
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
