import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { ArrowLeft, Building2, Calendar, CreditCard, FileText, Mail, Phone, Users } from 'lucide-react'
import { formatarData, formatarDataHora, formatarMoeda } from '@/lib/utils'

export function SAEscritorioDetalhePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['sa-tenant-detalhe', id],
    queryFn: () => api.get(`/super-admin/tenants/${id}`).then((response) => response.data),
    enabled: Boolean(id),
  })

  if (isLoading) return <div className="p-8 text-gray-500">Carregando escritório...</div>

  if (!data) {
    return (
      <div className="p-8 space-y-4">
        <button onClick={() => navigate('/super-admin/escritorios')} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4" />
          Voltar para escritórios
        </button>
        <div className="bg-white rounded-xl border p-8 text-center text-gray-500">Escritório não encontrado</div>
      </div>
    )
  }

  const assinaturaAtual = data.assinaturas?.[0]

  return (
    <div className="p-8 space-y-6">
      <div className="space-y-4">
        <button onClick={() => navigate('/super-admin/escritorios')} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4" />
          Voltar para escritórios
        </button>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{data.nome}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-500">
              <span className="inline-flex items-center gap-1"><Mail className="h-4 w-4" />{data.email}</span>
              {data.telefone && <span className="inline-flex items-center gap-1"><Phone className="h-4 w-4" />{data.telefone}</span>}
              {data.cnpj && <span>CNPJ: {data.cnpj}</span>}
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${data.ativo ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {data.ativo ? 'Ativo' : 'Suspenso'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Usuários', value: data._count?.usuarios ?? 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Processos', value: data._count?.processos ?? 0, icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Clientes', value: data._count?.clientes ?? 0, icon: Building2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Documentos', value: data._count?.documentos ?? 0, icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded-xl border p-5 shadow-sm">
            <div className={`inline-flex p-3 rounded-lg ${item.bg} mb-4`}>
              <item.icon className={`h-5 w-5 ${item.color}`} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{item.value}</p>
            <p className="text-sm text-gray-500 mt-1">{item.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white rounded-xl border p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Dados do escritório</h2>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div><dt className="text-gray-500">Nome</dt><dd className="font-medium text-gray-900 mt-1">{data.nome}</dd></div>
              <div><dt className="text-gray-500">Email</dt><dd className="font-medium text-gray-900 mt-1">{data.email}</dd></div>
              <div><dt className="text-gray-500">Telefone</dt><dd className="font-medium text-gray-900 mt-1">{data.telefone || 'Não informado'}</dd></div>
              <div><dt className="text-gray-500">Criado em</dt><dd className="font-medium text-gray-900 mt-1">{formatarData(data.criadoEm)}</dd></div>
              <div><dt className="text-gray-500">Plano atual</dt><dd className="font-medium text-gray-900 mt-1">{data.plano?.nome || 'Sem plano'}</dd></div>
              <div><dt className="text-gray-500">Valor mensal</dt><dd className="font-medium text-gray-900 mt-1">{formatarMoeda(Number(data.plano?.preco || 0))}</dd></div>
            </dl>
          </section>

          <section className="bg-white rounded-xl border p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Últimos acessos</h2>
            {!data.ultimosLogins?.length ? (
              <p className="text-sm text-gray-500">Nenhum login registrado até o momento.</p>
            ) : (
              <div className="space-y-3">
                {data.ultimosLogins.map((login: any) => (
                  <div key={login.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="font-medium text-gray-900">{login.usuario?.nome || 'Usuário removido'}</p>
                      <p className="text-xs text-gray-500">{login.usuario?.email || 'Sem email'}</p>
                    </div>
                    <span className="text-sm text-gray-500">{formatarDataHora(login.criadoEm)}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="bg-white rounded-xl border p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Assinatura atual</h2>
            {!assinaturaAtual ? (
              <p className="text-sm text-gray-500">Nenhuma assinatura encontrada.</p>
            ) : (
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-gray-900">
                  <CreditCard className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">{data.plano?.nome}</span>
                </div>
                <div className="flex justify-between"><span className="text-gray-500">Status</span><span className="font-medium capitalize text-gray-900">{assinaturaAtual.status}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Início</span><span className="font-medium text-gray-900">{formatarData(assinaturaAtual.inicioEm)}</span></div>
                {assinaturaAtual.fimEm && <div className="flex justify-between"><span className="text-gray-500">Fim</span><span className="font-medium text-gray-900">{formatarData(assinaturaAtual.fimEm)}</span></div>}
              </div>
            )}
          </section>

          <section className="bg-white rounded-xl border p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Capacidade do plano</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Máx. usuários</span><span className="font-medium text-gray-900">{data.plano?.maxUsuarios ?? '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Máx. processos</span><span className="font-medium text-gray-900">{data.plano?.maxProcessos === 999999 ? 'Ilimitado' : data.plano?.maxProcessos ?? '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Storage</span><span className="font-medium text-gray-900">{data.plano?.maxStorageMb >= 1024 ? `${data.plano.maxStorageMb / 1024} GB` : `${data.plano?.maxStorageMb ?? 0} MB`}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Assistente IA</span><span className="font-medium text-gray-900">{data.plano?.temIA ? 'Sim' : 'Não'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Portal do cliente</span><span className="font-medium text-gray-900">{data.plano?.temPortalCliente ? 'Sim' : 'Não'}</span></div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}