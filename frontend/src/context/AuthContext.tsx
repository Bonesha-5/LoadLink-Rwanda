/* eslint-disable react-refresh/only-export-components -- AuthProvider and useAuth are intentionally in the same file */
import { createContext, useContext, useState, type ReactNode } from 'react'

export type Role = 'shipper' | 'company' | 'admin'

export type User = { role: Role; name: string; token: string } | null

type AuthContextType = {
  user: User
  login: (name: string, role: Role, token: string) => void
  logout: () => void
  getToken: () => string
  isShipper: boolean
  isCompany: boolean
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

const STORAGE_KEYS: Record<Role, string> = {
  shipper: 'loadlink_shipper',
  company: 'loadlink_company',
  admin: 'loadlink_admin',
}

function readStoredUser(): User {
  for (const role of ['shipper', 'company', 'admin'] as const) {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS[role])
      if (!stored) continue
      const data = JSON.parse(stored)
      if (data.role === role && data.name && data.token) return { role, name: data.name, token: data.token }
    } catch {
      localStorage.removeItem(STORAGE_KEYS[role])
    }
  }
  return null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(readStoredUser)

  const login = (name: string, role: Role, token: string) => {
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key))
    const u = { role, name, token }
    setUser(u)
    localStorage.setItem(STORAGE_KEYS[role], JSON.stringify(u))
  }

  const getToken = () => user?.token ?? ''

  const logout = () => {
    if (user) localStorage.removeItem(STORAGE_KEYS[user.role])
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        getToken,
        isShipper: user?.role === 'shipper',
        isCompany: user?.role === 'company',
        isAdmin: user?.role === 'admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
