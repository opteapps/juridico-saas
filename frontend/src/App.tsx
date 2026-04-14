import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { AppLayout } from '@/components/layout/AppLayout'
import { SuperAdminLayout } from '@/components/layout/SuperAdminLayout'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { ProcessosPage } from '@/pages/processos/ProcessosPage'
import { ProcessoDetalhePage } from '@/pages/processos/ProcessoDetalhePage'
import { NovoProcessoPage } from '@/pages/processos/NovoProcessoPage'
import { EditarProcessoPage } from '@/pages/processos/EditarProcessoPage'
import { ClientesPage } from '@/pages/clientes/ClientesPage'
import { ClienteDetalhePage } from '@/pages/clientes/ClienteDetalhePage'
import { NovoClientePage } from '@/pages/clientes/NovoClientePage'
import { EditarClientePage } from '@/pages/clientes/EditarClientePage'
import { AgendaPage } from '@/pages/agenda/AgendaPage'
import { FinanceiroPage } from '@/pages/financeiro/FinanceiroPage'
import { DocumentosPage } from '@/pages/documentos/DocumentosPage'
import { DiligenciasPage } from '@/pages/diligencias/DiligenciasPage'
import { ConfiguracoesPage } from '@/pages/configuracoes/ConfiguracoesPage'
import { IAPage } from '@/pages/ia/IAPage'
import { JurimetriaPage } from '@/pages/jurimetria/JurimetriaPage'
import { UsuariosPage } from '@/pages/usuarios/UsuariosPage'
import { PortalClientePage } from '@/pages/portal-cliente/PortalClientePage'
import { SADashboardPage } from '@/pages/superadmin/SADashboardPage'
import { SAEscritoriosPage } from '@/pages/superadmin/SAEscritoriosPage'
import { SAEscritorioDetalhePage } from '@/pages/superadmin/SAEscritorioDetalhePage'
import { SACobrancasPage } from '@/pages/superadmin/SACobrancasPage'
import { SAPlanosPage } from '@/pages/superadmin/SAPlanosPage'
import { SAAuditoriaPage } from '@/pages/superadmin/SAAuditoriaPage'
import { SALGPDPage } from '@/pages/superadmin/SALGPDPage'
import { Toaster } from '@/components/ui/toaster'

function PrivateRoute({ children }: { children: JSX.Element }) {
  const { accessToken } = useAuthStore()
  return accessToken ? children : <Navigate to="/login" replace />
}

function SuperAdminRoute({ children }: { children: JSX.Element }) {
  const { accessToken, usuario } = useAuthStore()
  if (!accessToken) return <Navigate to="/login" replace />
  return usuario?.role === 'super_admin' ? children : <Navigate to="/" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/cadastro" element={<RegisterPage />} />
        <Route path="/portal-cliente" element={<PortalClientePage />} />

        <Route path="/" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
          <Route index element={<DashboardPage />} />
          <Route path="processos" element={<ProcessosPage />} />
          <Route path="processos/novo" element={<NovoProcessoPage />} />
          <Route path="processos/:id/editar" element={<EditarProcessoPage />} />
          <Route path="processos/:id" element={<ProcessoDetalhePage />} />
          <Route path="clientes" element={<ClientesPage />} />
          <Route path="clientes/novo" element={<NovoClientePage />} />
          <Route path="clientes/:id/editar" element={<EditarClientePage />} />
          <Route path="clientes/:id" element={<ClienteDetalhePage />} />
          <Route path="agenda" element={<AgendaPage />} />
          <Route path="financeiro" element={<FinanceiroPage />} />
          <Route path="documentos" element={<DocumentosPage />} />
          <Route path="diligencias" element={<DiligenciasPage />} />
          <Route path="configuracoes" element={<ConfiguracoesPage />} />
          <Route path="ia" element={<IAPage />} />
          <Route path="jurimetria" element={<JurimetriaPage />} />
          <Route path="usuarios" element={<UsuariosPage />} />
        </Route>

        <Route path="/super-admin" element={<SuperAdminRoute><SuperAdminLayout /></SuperAdminRoute>}>
          <Route index element={<SADashboardPage />} />
          <Route path="escritorios" element={<SAEscritoriosPage />} />
          <Route path="escritorios/:id" element={<SAEscritorioDetalhePage />} />
          <Route path="cobrancas" element={<SACobrancasPage />} />
          <Route path="planos" element={<SAPlanosPage />} />
          <Route path="auditoria" element={<SAAuditoriaPage />} />
          <Route path="lgpd" element={<SALGPDPage />} />
        </Route>
      </Routes>
      <Toaster />
    </BrowserRouter>
  )
}