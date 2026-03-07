/* eslint-disable react-refresh/only-export-components -- AuthProvider and useAuth are intentionally in the same file */
import { createContext, useContext, useState, type ReactNode } from 'react'

type User = { role: 'shipper'; name: string } | null

type AuthContextType = {
  user: User
  login: (name: string, role: 'shipper') => void
  logout: () => void
  isShipper: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

function readStoredUser(): User {
  try {
    const stored = localStorage.getItem('loadlink_shipper')
    if (!stored) return null
    const data = JSON.parse(stored)
    if (data.role === 'shipper' && data.name) return { role: 'shipper', name: data.name }
  } catch {
    localStorage.removeItem('loadlink_shipper')
  }
  return null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(readStoredUser)

  const login = (name: string, role: 'shipper') => {
    const u = { role, name }
    setUser(u)
    localStorage.setItem('loadlink_shipper', JSON.stringify(u))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('loadlink_shipper')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isShipper: user?.role === 'shipper' }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
