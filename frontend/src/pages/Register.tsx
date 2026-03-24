import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { Role } from '../context/AuthContext'

const ROLES: Role[] = ['shipper', 'company', 'admin']

const ROLE_LABELS: Record<Role, string> = {
  shipper: 'Shipper',
  company: 'Company',
  admin: 'Admin',
}

const ROLE_DASHBOARDS: Record<Role, string> = {
  shipper: '/loads',
  company: '/company/dashboard',
  admin: '/admin/dashboard',
}

const ROLE_REGISTER_DESCRIPTIONS: Record<Role, string> = {
  shipper: 'Create your account to post loads and manage shipments',
  company: 'Register your company to manage trucks and shipments',
  admin: 'Register for admin access to manage the platform',
}

const PANEL_CONTENT: Partial<Record<Role, { heading: string; description: string; footer: string; benefits: string[] }>> = {
  shipper: {
    heading: "Join Rwanda's logistics marketplace",
    description: 'Create your shipper account to post loads, receive offers from verified transport companies, and manage shipments in one place.',
    footer: "After registering you'll go to your shipper dashboard.",
    benefits: ['Post loads in minutes', 'Get offers from verified transport companies', 'Track shipments in one place'],
  },
  company: {
    heading: 'Join as a transport company',
    description: "Register to receive shipment requests from shippers, submit offers, and manage your trucks on Rwanda's logistics marketplace.",
    footer: "After registering you'll go to your company dashboard.",
    benefits: ['Get shipment requests from shippers', 'Submit competitive offers and win loads', 'Manage your fleet in one place'],
  },
}

export default function Register() {
  const { role: urlRole } = useParams<{ role: string }>()
  const role = (ROLES.includes(urlRole as Role) ? urlRole : 'shipper') as Role
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { login, user } = useAuth()
  const dashboard = ROLE_DASHBOARDS[role]
  const isLoggedInForThisRole = user?.role === role
  const panel = PANEL_CONTENT[role]

  useEffect(() => {
    if (!isLoggedInForThisRole) return
    if (location.pathname !== dashboard) navigate(dashboard, { replace: true })
  }, [isLoggedInForThisRole, navigate, dashboard, location.pathname])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !password.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/shipper/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim(), email: email.trim(), password }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data) {
        // No backend — demo fallback
        login(name.trim(), role, 'demo-token')
        navigate(dashboard, { replace: true })
        return
      }
      login(data.user.name, role, data.token)
      navigate(dashboard, { replace: true })
    } catch {
      // Network error — demo fallback
      login(name.trim(), role, 'demo-token')
      navigate(dashboard, { replace: true })
    } finally {
      setLoading(false)
    }
  }

  const formCard = (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow-xl shadow-stone-200/50 border border-stone-100 p-8 sm:p-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
            <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-stone-800 tracking-tight">
              Register as {ROLE_LABELS[role]}
            </h1>
            <p className="text-stone-500 text-sm mt-0.5">
              {ROLE_REGISTER_DESCRIPTIONS[role]}
            </p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-stone-700 mb-2">
              Full name
            </label>
            <input
              id="name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-stone-700 mb-2">
              Email address
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-semibold text-stone-700 mb-2">
              Phone number
            </label>
            <input
              id="phone"
              type="tel"
              placeholder="+250 788 123 456"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
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
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-accent text-white font-semibold rounded-xl hover:bg-accent-hover transition-all shadow-lg shadow-accent/25 hover:shadow-xl hover:shadow-accent/30 hover:-translate-y-0.5 active:scale-[0.99] disabled:opacity-60"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>
        <p className="mt-6 text-center text-stone-500 text-sm">
          Already have an account?{' '}
          <Link
            to={`/login/${role}`}
            className="text-accent font-semibold hover:underline"
          >
            Sign in
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
          <p className="relative z-10 text-sm text-white/70">{panel.footer}</p>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 bg-sand min-h-screen">
          <Link to="/" className="lg:hidden absolute top-6 left-6 text-sidebar font-bold text-xl tracking-tight z-20 hover:opacity-80">
            LoadLink Rwanda
          </Link>
          {formCard}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-sand py-12 px-6">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-[0.06]"
        style={{ backgroundImage: 'url(/cargo.jpg)' }}
      />
      <Link
        to="/"
        className="absolute top-6 left-6 text-sidebar font-bold text-xl tracking-tight z-20 hover:opacity-80"
      >
        LoadLink Rwanda
      </Link>
      {formCard}
    </div>
  )
}
