import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation, useParams } from 'react-router-dom'
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

const SHIPPER_BENEFITS = [
  'Post loads in minutes',
  'Get offers from verified transport companies',
  'Track shipments in one place',
]

const COMPANY_BENEFITS = [
  'Get shipment requests from shippers',
  'Submit competitive offers and win loads',
  'Manage your fleet in one place',
]

export default function Login() {
  const { role: urlRole } = useParams<{ role: string }>()
  const role = (ROLES.includes(urlRole as Role) ? urlRole : 'shipper') as Role
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isShipper, isCompany, isAdmin } = useAuth()
  const from =
    (location.state as { from?: { pathname: string } })?.from?.pathname ??
    ROLE_DASHBOARDS[role]

  const isLoggedIn = isShipper || isCompany || isAdmin
  const isShipperPage = role === 'shipper'
  const isCompanyPage = role === 'company'

  useEffect(() => {
    if (isLoggedIn) navigate(from, { replace: true })
  }, [isLoggedIn, navigate, from])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!phone.trim()) return
    login(phone.trim(), role)
    navigate(from, { replace: true })
  }

  const formCard = (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow-xl shadow-stone-200/50 border border-stone-100 p-8 sm:p-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-sidebar/10 flex items-center justify-center">
            <svg className="w-6 h-6 text-sidebar" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-stone-800 tracking-tight">
              {ROLE_LABELS[role]} sign in
            </h1>
            <p className="text-stone-500 text-sm mt-0.5">
              Sign in to your dashboard
            </p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
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
          <button
            type="submit"
            className="w-full py-3.5 bg-accent text-white font-semibold rounded-xl hover:bg-accent-hover transition-all shadow-lg shadow-accent/25 hover:shadow-xl hover:shadow-accent/30 hover:-translate-y-0.5 active:scale-[0.99]"
          >
            Sign in
          </button>
        </form>
        <p className="mt-6 text-center text-stone-500 text-sm">
          Don&apos;t have an account?{' '}
          <Link
            to={`/register/${role}`}
            className="text-accent font-semibold hover:underline"
          >
            Register as {role}
          </Link>
        </p>
      </div>
    </div>
  )

  if (isShipperPage) {
    return (
      <div className="min-h-screen flex">
        <div
          className="hidden lg:flex lg:w-[48%] flex-col justify-between p-10 xl:p-14 bg-sidebar text-white relative overflow-hidden"
          style={{
            backgroundImage: 'url(/cargo.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-sidebar/92" />
          <Link
            to="/"
            className="relative z-10 text-xl font-bold tracking-tight text-white hover:text-white/90 transition-opacity"
          >
            LoadLink Rwanda
          </Link>
          <div className="relative z-10 space-y-8">
            <h2 className="text-3xl xl:text-4xl font-bold tracking-tight leading-tight">
              Post shipments. Get competitive offers.
            </h2>
            <p className="text-white/90 text-lg max-w-sm">
              Rwanda&apos;s logistics marketplace for shippers. Reach verified transport companies and manage your loads in one place.
            </p>
            <ul className="space-y-3">
              {SHIPPER_BENEFITS.map((benefit) => (
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
            After sign in you&apos;ll go to your shipper dashboard.
          </p>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 bg-sand min-h-screen">
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

  if (isCompanyPage) {
    return (
      <div className="min-h-screen flex">
        <div
          className="hidden lg:flex lg:w-[48%] flex-col justify-between p-10 xl:p-14 bg-sidebar text-white relative overflow-hidden"
          style={{
            backgroundImage: 'url(/cargo.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-sidebar/92" />
          <Link
            to="/"
            className="relative z-10 text-xl font-bold tracking-tight text-white hover:text-white/90 transition-opacity"
          >
            LoadLink Rwanda
          </Link>
          <div className="relative z-10 space-y-8">
            <h2 className="text-3xl xl:text-4xl font-bold tracking-tight leading-tight">
              Win loads. Grow your transport business.
            </h2>
            <p className="text-white/90 text-lg max-w-sm">
              Sign in to your company portal to view shipment requests, submit offers, and manage your trucks.
            </p>
            <ul className="space-y-3">
              {COMPANY_BENEFITS.map((benefit) => (
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
            After sign in you&apos;ll go to your company dashboard.
          </p>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 bg-sand min-h-screen">
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
