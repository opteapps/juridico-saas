import { Briefcase, Scale, FileText, Calendar } from 'lucide-react'

export function PortalClientePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center px-6">
      <div className="text-center text-white max-w-lg">
        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Briefcase className="w-9 h-9" />
        </div>
        <h1 className="text-3xl font-bold mb-3">Portal do Cliente</h1>
        <p className="text-blue-200 mb-8">Acesse seus processos e documentos de forma rápida e segura.</p>

        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { icon: Scale, label: 'Processos' },
            { icon: FileText, label: 'Documentos' },
            { icon: Calendar, label: 'Audiências' },
          ].map(item => (
            <div key={item.label} className="bg-white/10 rounded-xl p-4">
              <item.icon className="w-6 h-6 mx-auto mb-2" />
              <p className="text-sm">{item.label}</p>
            </div>
          ))}
        </div>

        <div className="bg-white/10 rounded-xl p-6">
          <p className="text-sm text-blue-200 mb-4">Portal em desenvolvimento. Entre em contato com seu advogado.</p>
          <a href="/login" className="inline-flex items-center justify-center px-6 py-2.5 bg-white text-blue-900 rounded-lg font-semibold text-sm hover:bg-blue-50 transition-colors">
            Área do Advogado
          </a>
        </div>
      </div>
    </div>
  )
}
