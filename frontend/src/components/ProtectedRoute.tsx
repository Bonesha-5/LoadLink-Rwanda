import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { Role } from '../context/AuthContext'

const LOGIN_PATHS: Record<Role, string> = {
  shipper: '/login/shipper',
  company: '/login/company',
  admin: '/login/admin',
}

type Props = {
  children: React.ReactNode
  role: Role
}

export default function ProtectedRoute({ children, role }: Props) {
  const { isShipper, isCompany, isAdmin, user } = useAuth()
  const location = useLocation()

  const isAuthorized =
    (role === 'shipper' && isShipper) ||
    (role === 'company' && isCompany) ||
    (role === 'admin' && isAdmin)

  const hasToken = Boolean(user?.token)

  // Company + Admin routes require a JWT (per product requirements).
  if ((role === 'company' || role === 'admin') && !hasToken) {
    return <Navigate to={LOGIN_PATHS[role]} state={{ from: location }} replace />
  }

  if (!isAuthorized) {
    return <Navigate to={LOGIN_PATHS[role]} state={{ from: location }} replace />
  }

  return <>{children}</>
}
