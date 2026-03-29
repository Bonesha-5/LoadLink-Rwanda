import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { Role } from '../context/AuthContext'
import { companyLogin } from '../api/companyApi'
import { adminLogin } from '../api/adminApi'
import type { ApiError } from '../api/http'
import { createMockJwt, isMockAuthMode } from '../auth/mockJwt'
import { getCompanyByEmailDemo } from '../data/storage'

const ROLES: Role[] = ['shipper', 'company', 'admin']

const ROLE_LABELS: Record<Role, string> = {
  shipper: 'Shipper',
  company: 'Company',
  admin: 'Admin',
}

const ROLE_DASHBOARDS: Record<Role, string> = {
  shipper: '/profile',
  company: '/company/dashboard',
  admin: '/admin/companies',
}

const PANEL_CONTENT: Partial<Record<Role, { heading: string; description: string; footer: string; benefits: string[] }>> = {
  shipper: {
    heading: "Welcome back, Shipper",
    description: 'Sign in to manage your shipments, track deliveries, and pay securely with escrow.',
    footer: "You'll be taken to your shipper dashboard.",
    benefits: ['Post loads in minutes', 'Get offers from verified transport companies', 'Track shipments in one place'],
  },
  company: {
    heading: 'Welcome back, Transport Company',
    description: 'Sign in to view shipment requests, manage your trucks, and grow your business.',
    footer: "You'll be taken to your company dashboard.",
    benefits: ['Browse available shipment requests', 'Submit offers and win loads', 'Manage your fleet in one place'],
  },
}

export default function Login() {
  const { role: urlRole } = useParams<{ role: string }>()
  const role = (ROLES.includes(urlRole as Role) ? urlRole : 'shipper') as Role
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const location = useLocation()
  const { login, user } = useAuth()
  const from =
    (location.state as { from?: { pathname: string } })?.from?.pathname ??
    ROLE_DASHBOARDS[role]
  const regState = location.state as { registered?: boolean; registeredMessage?: string } | null
  const registeredNotice = Boolean(regState?.registered) || Boolean(regState?.registeredMessage?.trim())
  const registeredBannerText = regState?.registeredMessage?.trim()
    ? String(regState.registeredMessage)
    : 'Registration complete. Sign in below.'

  const hasToken = Boolean(user?.token)
  const isLoggedInForThisRole = user?.role === role && (role === 'shipper' || hasToken)
  const dashboard = ROLE_DASHBOARDS[role]
  const panel = PANEL_CONTENT[role]

  useEffect(() => {
    if (!isLoggedInForThisRole) return
    if (location.pathname !== dashboard) navigate(dashboard, { replace: true })
  }, [isLoggedInForThisRole, navigate, dashboard, location.pathname])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    // Company login: use real backend endpoint when an email is provided.
    if (role === 'company') {
      const emailOrName = username.trim()
      if (!emailOrName) {
        setError('Enter your company email.')
        return
      }
      if (!emailOrName.includes('@')) {
        setError('Use a valid company email address (include @).')
        return
      }
      if (!password.trim()) {
        setError('Enter your password.')
        return
      }

      setBusy(true)
      try {
        if (isMockAuthMode()) {
          const company = getCompanyByEmailDemo(emailOrName)
          // Use the actual registered company name, not the email prefix
          const name = company?.name || emailOrName.split('@')[0] || 'Company'
          const status = company?.status ?? 'PENDING_VERIFICATION'
          login(name, 'company', {
            token: createMockJwt({ role: 'COMPANY', email: emailOrName, name, status }),
            email: emailOrName,
            status,
          })
          navigate(from, { replace: true })
        } else {
          const res = await companyLogin(emailOrName, password)
          const name = res.user?.name || 'Company'
          login(name, 'company', {
            token: res.token,
            email: res.user?.email ?? emailOrName,
            status: res.user?.status ?? null,
          })
          navigate(from, { replace: true })
        }
      } catch (e) {
        const err = e as ApiError
        setError(err.message || 'Could not sign in.')
      } finally {
        setBusy(false)
      }
      return
    }

    if (role === 'admin') {
      const email = username.trim()
      if (!email) {
        setError('Enter your admin email.')
        return
      }
      if (!email.includes('@')) {
        setError('Use a valid admin email address (include @).')
        return
      }
      if (!password.trim()) {
        setError('Enter your password.')
        return
      }

      setBusy(true)
      try {
        if (isMockAuthMode()) {
          const name = email.split('@')[0] || 'Admin'
          login(name, 'admin', {
            token: createMockJwt({ role: 'ADMIN', email, name }),
            email,
          })
          navigate(from, { replace: true })
        } else {
          const res = await adminLogin(email, password)
          const name = res.user?.name || 'Admin'
          login(name, 'admin', {
            token: res.token,
            email: res.user?.email ?? email,
          })
          navigate(from, { replace: true })
        }
      } catch (e) {
        const err = e as ApiError
        setError(err.message || 'Could not sign in.')
      } finally {
        setBusy(false)
      }
      return
    }

    // Demo fallback (shipper / admin without API email flow)
    if (!username.trim()) {
      setError('Enter a username or email.')
      return
    }
    login(username.trim(), role)
    navigate(from, { replace: true })
  }

  const formCard = (
    <div className="w-full max-w-md mx-auto ll-animate-in">
      <div className="bg-white rounded-3xl shadow-xl shadow-stone-200/50 border border-stone-100 p-8 sm:p-10 transition-shadow duration-200 hover:shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
            <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-stone-800 tracking-tight">
              Sign in as {ROLE_LABELS[role]}
            </h1>
            <p className="text-stone-500 text-sm mt-0.5">
              Enter your credentials to access your dashboard
            </p>
          </div>
        </div>
        {registeredNotice && (
          <p className="mb-4 text-sm text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
            {registeredBannerText}
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="username" className="block text-sm font-semibold text-stone-700 mb-2">
              {role === 'company' ? 'Company email' : role === 'admin' ? 'Admin email' : 'Username'}
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              placeholder={
                role === 'company'
                  ? 'e.g. company@example.com'
                  : role === 'admin'
                    ? 'e.g. admin@loadlink.rw'
                    : 'e.g. alice'
              }
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-stone-700 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full py-3.5 bg-accent text-white font-semibold rounded-xl hover:bg-accent-hover transition-all shadow-lg shadow-accent/25 hover:shadow-xl hover:shadow-accent/30 hover:-translate-y-0.5 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        {error && (
          <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            {error}
          </p>
        )}
        <p className="mt-6 text-center text-stone-500 text-sm">
          Don&apos;t have an account?{' '}
          <Link to={`/register/${role}`} className="text-accent font-semibold hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  )

  if (panel) {
    return (
      <div className="min-h-screen flex">
        <div
          className="hidden lg:flex lg:w-[48%] flex-col justify-between p-10 xl:p-14 bg-sidebar text-white relative overflow-hidden"
          style={{ backgroundImage: 'url(/cargo.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}
        >
          <div className="absolute inset-0 bg-sidebar/92" />
          <Link to="/" className="relative z-10 text-xl font-bold tracking-tight text-white hover:text-white/90 transition-opacity">
            LoadLink Rwanda
          </Link>
          <div className="relative z-10 space-y-8">
            <h2 className="text-3xl xl:text-4xl font-bold tracking-tight leading-tight">{panel.heading}</h2>
            <p className="text-white/90 text-lg max-w-sm">{panel.description}</p>
            <ul className="space-y-3">
              {panel.benefits.map((benefit) => (
                <li key={benefit} className="flex items-center gap-3 text-white/95">
                  <span className="w-5 h-5 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
          <p className="relative z-10 text-sm text-white/70">
            After sign in you&apos;ll go to the home page (demo shipper).
          </p>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 bg-[#F6F7FB] min-h-screen">
          <Link
            to="/"
            className="lg:hidden absolute top-6 left-6 text-sidebar font-bold text-xl tracking-tight z-20 hover:opacity-80"
          >
            LoadLink Rwanda
          </Link>
          {formCard}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-[#F6F7FB] py-12 px-6">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-[0.06] pointer-events-none"
        style={{ backgroundImage: 'url(/cargo.jpg)' }}
      />
      <Link to="/" className="absolute top-6 left-6 text-sidebar font-bold text-xl tracking-tight z-20 hover:opacity-80">
        LoadLink Rwanda
      </Link>
      <div className="w-full max-w-md relative z-10">
        {formCard}
      </div>
    </div>
  )
}
