import { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { Role } from '../context/AuthContext'

const ROLES: Role[] = ['shipper', 'company', 'admin']

const ROLE_LABELS: Record<Role, string> = {
  shipper: 'Shipper',
  company: 'Company',
  admin: 'Admin',
}

const ROLE_DASHBOARDS: Record<Role, string> = {
  shipper: '/profile',
  company: '/company/dashboard',
  admin: '/admin/dashboard',
}

const ROLE_REGISTER_DESCRIPTIONS: Record<Role, string> = {
  shipper: 'Create your account to post loads and manage shipments',
  company: 'Register your company to manage trucks and shipments',
  admin: 'Register for admin access to manage the platform',
}

export default function Register() {
  const { role: urlRole } = useParams<{ role: string }>()
  const role = (ROLES.includes(urlRole as Role) ? urlRole : 'shipper') as Role
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()
  const { login, isShipper, isCompany, isAdmin } = useAuth()
  const dashboard = ROLE_DASHBOARDS[role]
  const isLoggedIn = isShipper || isCompany || isAdmin

  useEffect(() => {
    if (isLoggedIn) navigate(dashboard, { replace: true })
  }, [isLoggedIn, navigate, dashboard])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !phone.trim()) return
    login(name.trim(), role)
    navigate(dashboard, { replace: true })
  }

  return (
    <div className="min-h-screen h-screen flex flex-col items-center justify-center relative overflow-hidden bg-sand">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-[0.08]"
        style={{ backgroundImage: 'url(/cargo.jpg)' }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-sand/95 via-sand/90 to-sand/95" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_60%,rgba(61,41,35,0.06)_100%)]" />

      <Link
        to="/"
        className="absolute top-6 left-6 sm:top-8 sm:left-8 text-sidebar font-bold text-xl tracking-tight z-20 hover:opacity-80 transition-opacity"
      >
        LoadLink Rwanda
      </Link>

      <div className="w-full max-w-md px-6 relative z-10">
        <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl shadow-stone-400/20 border border-white/60 p-8 sm:p-10">
          <h1 className="text-2xl font-bold text-stone-800 tracking-tight">
            Register as {ROLE_LABELS[role]}
          </h1>
          <p className="text-stone-500 mt-1.5">
            {ROLE_REGISTER_DESCRIPTIONS[role]}
          </p>
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
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
                className="w-full px-4 py-3.5 rounded-xl bg-cream/80 border border-stone-200 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-sidebar focus:ring-2 focus:ring-sidebar/20 transition-all"
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
                className="w-full px-4 py-3.5 rounded-xl bg-cream/80 border border-stone-200 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-sidebar focus:ring-2 focus:ring-sidebar/20 transition-all"
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
                className="w-full px-4 py-3.5 rounded-xl bg-cream/80 border border-stone-200 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-sidebar focus:ring-2 focus:ring-sidebar/20 transition-all"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3.5 bg-sidebar text-white font-semibold rounded-xl hover:bg-sidebar-hover transition-all shadow-lg hover:shadow-xl hover:shadow-sidebar/25 active:scale-[0.99]"
            >
              Create account
            </button>
          </form>
          <p className="mt-6 text-center text-stone-500 text-sm">
            Already have an account?{' '}
            <Link
              to={`/login/${role}`}
              className="text-sidebar font-semibold hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
