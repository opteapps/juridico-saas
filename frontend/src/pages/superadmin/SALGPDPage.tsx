export function SALGPDPage() {
  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">LGPD</h1>
        <p className="text-gray-500 mt-1">Solicitações de titulares de dados e conformidade com a LGPD</p>
      </div>

      <div className="bg-white rounded-xl border p-6 shadow-sm space-y-4">
        <div className="rounded-lg bg-blue-50 border border-blue-100 p-4 text-sm text-blue-900">
          <p className="font-semibold mb-1">Lei Geral de Proteção de Dados (LGPD — Lei 13.709/2018)</p>
          <p>O sistema registra automaticamente todas as solicitações de acesso, exclusão e portabilidade de dados pessoais realizadas pelos titulares.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Solicitações de Acesso', type: 'LGPD_ACESSO' },
            { label: 'Solicitações de Exclusão', type: 'LGPD_EXCLUSAO' },
            { label: 'Portabilidade de Dados', type: 'LGPD_PORTABILIDADE' },
          ].map((item) => (
            <div key={item.type} className="rounded-lg border p-5 bg-gray-50">
              <p className="text-sm font-medium text-gray-900">{item.label}</p>
              <p className="text-3xl font-bold mt-2 text-gray-800">0</p>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-dashed p-10 text-center">
          <p className="text-gray-600 font-medium">Nenhuma solicitação LGPD registrada</p>
          <p className="text-gray-400 text-sm">As solicitações dos titulares aparecerão aqui</p>
        </div>
      </div>
    </div>
  )
}