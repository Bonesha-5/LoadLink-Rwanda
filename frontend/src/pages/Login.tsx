import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { Role } from '../context/AuthContext'
import type { ApiError } from '../api/http'
import { apiRequest } from '../api/http'
import { companyLogin } from '../api/companyApi'
import { shipperLogin } from '../api/shipperApi'

const ROLES: Role[] = ['shipper', 'company', 'admin']

const ROLE_LABELS: Record<Role, string> = {
  shipper: 'Shipper',
  company: 'Company',
  admin:   'Admin',
}

const ROLE_DASHBOARDS: Record<Role, string> = {
  shipper: '/profile',
  company: '/company/dashboard',
  admin:   '/admin/companies',
}

const PANEL_CONTENT: Partial<Record<Role, { heading: string; description: string; footer: string; benefits: string[] }>> = {
  shipper: {
    heading:     'Welcome back, Shipper',
    description: 'Sign in to manage your shipments, track deliveries, and pay securely with escrow.',
    footer:      "You'll be taken to your shipper dashboard.",
    benefits:    ['Post loads in minutes', 'Get offers from verified transport companies', 'Track shipments in one place'],
  },
  company: {
    heading:     'Welcome back, Transport Company',
    description: 'Sign in to view shipment requests, manage your trucks, and grow your business.',
    footer:      "You'll be taken to your company dashboard.",
    benefits:    ['Browse available shipment requests', 'Submit offers and win loads', 'Manage your fleet in one place'],
  },
}

export default function Login() {
  const { role: urlRole } = useParams<{ role: string }>()
  const role = (ROLES.includes(urlRole as Role) ? urlRole : 'shipper') as Role

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [busy,     setBusy]     = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  const navigate = useNavigate()
  const location = useLocation()
  const { login, user } = useAuth()

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? ROLE_DASHBOARDS[role]
  const regState         = location.state as { registered?: boolean; registeredMessage?: string } | null
  const registeredNotice = Boolean(regState?.registered) || Boolean(regState?.registeredMessage?.trim())
  const registeredBannerText = regState?.registeredMessage?.trim()
    ? String(regState.registeredMessage)
    : 'Registration complete. Sign in below.'

  const hasToken            = Boolean(user?.token)
  const isLoggedInForRole   = user?.role === role && (role === 'shipper' || hasToken)
  const dashboard           = ROLE_DASHBOARDS[role]
  const panel               = PANEL_CONTENT[role]

  useEffect(() => {
    if (!isLoggedInForRole) return
    if (location.pathname !== dashboard) navigate(dashboard, { replace: true })
  }, [isLoggedInForRole, navigate, dashboard, location.pathname])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const emailVal = email.trim()

    // ── SHIPPER ────────────────────────────────────────────────
    if (role === 'shipper') {
      if (!emailVal || !emailVal.includes('@')) { setError('Enter a valid email address.'); return }
      if (!password.trim())                     { setError('Enter your password.'); return }

      setBusy(true)
      try {
        const res = await shipperLogin(emailVal, password.trim())
          login(res.user.name, 'shipper', {
            token: res.token,
            email: res.user.email,
          })
          navigate(from, { replace: true })
      } catch (e) {
        setError((e as ApiError).message || 'Could not sign in.')
      } finally {
        setBusy(false)
      }
      return
    }

    // ── COMPANY ────────────────────────────────────────────────
    if (role === 'company') {
      if (!emailVal || !emailVal.includes('@')) { setError('Enter your company email.'); return }
      if (!password.trim())                     { setError('Enter your password.'); return }

      setBusy(true)
      try {
        const res = await companyLogin(emailVal, password.trim())
          login(res.user.company_name ?? emailVal.split('@')[0], 'company', {
            token:  res.token,
            email:  res.user.email,
            status: res.user.status,
          })
          navigate(from, { replace: true })
      } catch (e) {
        setError((e as ApiError).message || 'Could not sign in.')
      } finally {
        setBusy(false)
      }
      return
    }

    // ── ADMIN ──────────────────────────────────────────────────
    if (role === 'admin') {
      if (!emailVal || !emailVal.includes('@')) { setError('Enter your admin email.'); return }
      if (!password.trim())                     { setError('Enter your password.'); return }

      setBusy(true)
      try {
        const res = await apiRequest<{ success: boolean; token: string; user: { name: string; email: string } }>(
            '/auth/admin/login',
            { method: 'POST', body: { email: emailVal, password: password.trim() } }
          )
          login(res.user?.name || emailVal.split('@')[0], 'admin', {
            token: res.token,
            email: res.user?.email ?? emailVal,
          })
          navigate(from, { replace: true })
      } catch (e) {
        setError((e as ApiError).message || 'Could not sign in.')
      } finally {
        setBusy(false)
      }
      return
    }
  }

  const inputCls = 'w-full px-4 py-3.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all'

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
            <h1 className="text-2xl font-bold text-stone-800 tracking-tight">Sign in as {ROLE_LABELS[role]}</h1>
            <p className="text-stone-500 text-sm mt-0.5">Enter your credentials to access your dashboard</p>
          </div>
        </div>

        {registeredNotice && (
          <p className="mb-4 text-sm text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
            {registeredBannerText}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-stone-700 mb-2">
              {role === 'company' ? 'Company email' : role === 'admin' ? 'Admin email' : 'Email address'}
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder={
                role === 'company' ? 'e.g. company@example.com'
                : role === 'admin' ? 'e.g. admin@loadlink.rw'
                : 'e.g. alice@example.com'
              }
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-stone-700 mb-2">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls}
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

        <p className="mt-6 text-center text-stone-500 text-sm">
          Don&apos;t have an account?{' '}
          <Link to={`/register/${role}`} className="text-accent font-semibold hover:underline">Create one</Link>
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
          <p className="relative z-10 text-sm text-white/70">{panel.footer}</p>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 bg-[#F6F7FB] min-h-screen">
          <Link to="/" className="lg:hidden absolute top-6 left-6 text-sidebar font-bold text-xl tracking-tight z-20 hover:opacity-80">
            LoadLink Rwanda
          </Link>
          {formCard}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-[#F6F7FB] py-12 px-6">
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-[0.06] pointer-events-none" style={{ backgroundImage: 'url(/cargo.jpg)' }} />
      <Link to="/" className="absolute top-6 left-6 text-sidebar font-bold text-xl tracking-tight z-20 hover:opacity-80">LoadLink Rwanda</Link>
      <div className="w-full max-w-md relative z-10">{formCard}</div>
    </div>
  )
}
