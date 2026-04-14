import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Usuario {
  id: string
  nome: string
  email: string
  role: string
  tenantId: string | null
  tenant: { id: string; nome: string; logoUrl: string | null } | null
  areasAtuacao: string[]
  avatarUrl: string | null
}

interface AuthState {
  usuario: Usuario | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  setAuth: (usuario: Usuario, accessToken: string, refreshToken: string) => void
  setTokens: (accessToken: string, refreshToken: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      usuario: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      setAuth: (usuario, accessToken, refreshToken) =>
        set({ usuario, accessToken, refreshToken, isAuthenticated: true }),
      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),
      logout: () =>
        set({ usuario: null, accessToken: null, refreshToken: null, isAuthenticated: false }),
    }),
    { name: 'juridico-auth', partialize: (s) => ({ usuario: s.usuario, refreshToken: s.refreshToken }) }
  )
)
