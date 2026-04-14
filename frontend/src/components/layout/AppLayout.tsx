import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard, Scale, Users, Calendar, DollarSign, FileText,
  ClipboardList, Sparkles, BarChart2, Settings, LogOut, Bell,
  Menu, X, UserCircle, ChevronDown, Briefcase
} from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/processos', label: 'Processos', icon: Scale },
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/agenda', label: 'Agenda', icon: Calendar },
  { to: '/financeiro', label: 'Financeiro', icon: DollarSign },
  { to: '/documentos', label: 'Documentos', icon: FileText },
  { to: '/diligencias', label: 'Diligências', icon: ClipboardList },
  { to: '/ia', label: 'Assistente IA', icon: Sparkles },
  { to: '/jurimetria', label: 'Jurimetria', icon: BarChart2 },
]

const bottomNavItems = [
  { to: '/usuarios', label: 'Usuários', icon: UserCircle },
  { to: '/configuracoes', label: 'Configurações', icon: Settings },
]

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const { usuario, logout } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (usuario?.role === 'super_admin') {
      navigate('/super-admin', { replace: true })
    }
  }, [usuario, navigate])

  const handleLogout = async () => {
    try {
      const refreshToken = useAuthStore.getState().refreshToken
      await api.post('/auth/logout', { refreshToken })
    } catch {}
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          'flex flex-col transition-all duration-300 bg-sidebar text-sidebar-foreground border-r border-sidebar-border',
          sidebarOpen ? 'w-64' : 'w-16'
        )}
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            {sidebarOpen && (
              <div className="min-w-0">
                <p className="text-sm font-bold truncate">Jurídico SaaS</p>
                <p className="text-xs text-sidebar-foreground/60 truncate">{usuario?.tenant?.nome || 'Sistema'}</p>
              </div>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="ml-auto flex-shrink-0 p-1 rounded hover:bg-sidebar-accent transition-colors"
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Bottom nav */}
        <div className="px-2 py-4 border-t border-sidebar-border space-y-1">
          {bottomNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-6 border-b bg-card">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-foreground">
              {/* Page title is set by each page */}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications */}
            <button className="relative p-2 rounded-md hover:bg-accent transition-colors">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
            </button>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-semibold">
                  {usuario?.nome?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium leading-none">{usuario?.nome}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                    {usuario?.role?.replace('_', ' ')}
                  </p>
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-card border rounded-md shadow-lg z-50">
                  <div className="p-2">
                    <button
                      onClick={() => navigate('/configuracoes')}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded hover:bg-accent transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      Configurações
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded hover:bg-destructive hover:text-destructive-foreground transition-colors text-destructive"
                    >
                      <LogOut className="w-4 h-4" />
                      Sair
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
