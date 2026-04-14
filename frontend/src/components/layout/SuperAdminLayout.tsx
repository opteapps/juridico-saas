import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Building2, CreditCard, ShieldCheck,
  ClipboardList, Settings, LogOut, Scale, Users, BarChart3, ChevronRight
} from 'lucide-react'

const navItems = [
  { icon: LayoutDashboard, label: 'Painel Geral', href: '/super-admin' },
  { icon: Building2, label: 'Escritórios', href: '/super-admin/escritorios' },
  { icon: CreditCard, label: 'Planos e Cobranças', href: '/super-admin/cobrancas' },
  { icon: Users, label: 'Usuários do Sistema', href: '/super-admin/usuarios-sistema' },
  { icon: BarChart3, label: 'Relatórios', href: '/super-admin/relatorios' },
  { icon: ShieldCheck, label: 'LGPD e Privacidade', href: '/super-admin/lgpd' },
  { icon: ClipboardList, label: 'Auditoria', href: '/super-admin/auditoria' },
  { icon: Settings, label: 'Configurações', href: '/super-admin/configuracoes' },
]

export function SuperAdminLayout() {
  const { usuario, logout } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-2 mb-1">
            <Scale className="h-6 w-6 text-blue-400" />
            <span className="font-bold text-lg">JurídicoSaaS</span>
          </div>
          <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
            Painel Administrativo
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const active = location.pathname === item.href || 
              (item.href !== '/super-admin' && location.pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                  active
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                )}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {item.label}
                {active && <ChevronRight className="h-3 w-3 ml-auto" />}
              </Link>
            )
          })}
        </nav>

        {/* User info + logout */}
        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-semibold">
              {usuario?.nome?.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{usuario?.nome}</p>
              <p className="text-xs text-slate-400">Super Admin</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sair do sistema
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
