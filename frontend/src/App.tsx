import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { AppLayout } from '@/components/layout/AppLayout'
import { SuperAdminLayout } from '@/components/layout/SuperAdminLayout'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { ProcessosPage } from '@/pages/processos/ProcessosPage'
import { ProcessoDetalhePage } from '@/pages/processos/ProcessoDetalhePage'
import { NovoProcessoPage } from '@/pages/processos/NovoProcessoPage'
import { ClientesPage } from '@/pages/clientes/ClientesPage'
import { ClienteDetalhePage } from '@/pages/clientes/ClienteDetalhePage'
import { AgendaPage } from '@/pages/agenda/AgendaPage'
import { FinanceiroPage } from '@/pages/financeiro/FinanceiroPage'
import { DocumentosPage } from '@/pages/documentos/DocumentosPage'
import { DiligenciasPage } from '@/pages/diligencias/DiligenciasPage'
import { IAPage } from '@/pages/ia/IAPage'
import { JurimetriaPage } from '@/pages/jurimetria/JurimetriaPage'
import { UsuariosPage } from '@/pages/usuarios/UsuariosPage'
import { ConfiguracoesPage } from '@/pages/configuracoes/ConfiguracoesPage'
import { PortalClientePage } from '@/pages/portal-cliente/PortalClientePage'
import { SADashboardPage } from '@/pages/superadmin/SADashboardPage'
import { SAEscritoriosPage } from '@/pages/superadmin/SAEscritoriosPage'
import { SACobrancasPage } from '@/pages/superadmin/SACobrancasPage'
import { SAAuditoriaPage } from '@/pages/superadmin/SAAuditoriaPage'
import { SALGPDPage } from '@/pages/superadmin/SALGPDPage'
import { SAPlanosPage } from '@/pages/superadmin/SAPlanosPage'
import { Toaster } from '@/components/ui/toaster'

function EmDesenvolvimento({ titulo }: { titulo: string }) {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{titulo}</h1>
      <p className="text-gray-500">Em desenvolvimento</p>
    </div>
  )
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function SuperAdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, usuario } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (usuario?.role !== 'super_admin') return <Navigate to="/" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/cadastro" element={<RegisterPage />} />
        <Route path="/portal-cliente" element={<PortalClientePage />} />

        {/* Private routes */}
        <Route path="/" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
          <Route index element={<DashboardPage />} />
          <Route path="processos" element={<ProcessosPage />} />
          <Route path="processos/novo" element={<NovoProcessoPage />} />
          <Route path="processos/:id" element={<ProcessoDetalhePage />} />
          <Route path="clientes" element={<ClientesPage />} />
          <Route path="clientes/:id" element={<ClienteDetalhePage />} />
          <Route path="agenda" element={<AgendaPage />} />
          <Route path="financeiro" element={<FinanceiroPage />} />
          <Route path="documentos" element={<DocumentosPage />} />
          <Route path="diligencias" element={<DiligenciasPage />} />
          <Route path="ia" element={<IAPage />} />
          <Route path="jurimetria" element={<JurimetriaPage />} />
          <Route path="usuarios" element={<UsuariosPage />} />
          <Route path="configuracoes" element={<ConfiguracoesPage />} />
        </Route>

        {/* Super Admin */}
        <Route path="/super-admin" element={<SuperAdminRoute><SuperAdminLayout /></SuperAdminRoute>}>
          <Route index element={<SADashboardPage />} />
          <Route path="escritorios" element={<SAEscritoriosPage />} />
          <Route path="cobrancas" element={<SACobrancasPage />} />
          <Route path="planos" element={<SAPlanosPage />} />
          <Route path="auditoria" element={<SAAuditoriaPage />} />
          <Route path="lgpd" element={<SALGPDPage />} />
          <Route path="usuarios-sistema" element={<EmDesenvolvimento titulo="Usuários do Sistema" />} />
          <Route path="relatorios" element={<EmDesenvolvimento titulo="Relatórios" />} />
          <Route path="configuracoes" element={<EmDesenvolvimento titulo="Configurações do Sistema" />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </>
  )
}
