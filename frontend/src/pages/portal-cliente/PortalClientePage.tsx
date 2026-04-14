import { Briefcase, Scale, FileText, Calendar, ShieldCheck } from 'lucide-react'

export function PortalClientePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900 px-6 py-12 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
              <Briefcase className="h-9 w-9" />
            </div>
            <h1 className="mb-4 text-4xl font-bold">Portal do Cliente</h1>
            <p className="max-w-xl text-blue-100">
              Um espaço seguro para acompanhar processos, acessar documentos e visualizar compromissos importantes do seu atendimento jurídico.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                { icon: Scale, title: 'Acompanhamento processual', text: 'Consulte o andamento dos seus processos e principais movimentações.' },
                { icon: FileText, title: 'Documentos centralizados', text: 'Baixe documentos compartilhados pelo escritório em um só lugar.' },
                { icon: Calendar, title: 'Próximos compromissos', text: 'Visualize audiências, reuniões e datas relevantes do seu caso.' },
                { icon: ShieldCheck, title: 'Acesso protegido', text: 'Seus dados ficam disponíveis apenas para usuários autorizados.' },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <item.icon className="mb-3 h-6 w-6 text-blue-200" />
                  <h2 className="font-semibold">{item.title}</h2>
                  <p className="mt-2 text-sm text-blue-100">{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/10 p-8 backdrop-blur">
            <h2 className="text-2xl font-semibold">Acesso ao portal</h2>
            <p className="mt-3 text-sm text-blue-100">
              O backend já possui a base multi-tenant pronta, mas o fluxo de autenticação do cliente ainda precisa ser finalizado.
            </p>

            <div className="mt-6 space-y-4">
              <div className="rounded-xl bg-white/10 p-4">
                <p className="text-sm font-medium">Disponível em breve</p>
                <p className="mt-1 text-sm text-blue-100">Login do cliente, visualização de documentos e timeline do processo.</p>
              </div>
              <div className="rounded-xl bg-white/10 p-4">
                <p className="text-sm font-medium">Enquanto isso</p>
                <p className="mt-1 text-sm text-blue-100">O acesso principal do sistema continua pela área interna do escritório.</p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <a href="/login" className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-2.5 text-sm font-semibold text-blue-900 transition-colors hover:bg-blue-50">
                Área do Advogado
              </a>
              <a href="mailto:suporte@juridicosaas.com.br" className="inline-flex items-center justify-center rounded-lg border border-white/20 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10">
                Solicitar acesso
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}