import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { Role } from '../context/AuthContext'
import { companyRegister } from '../api/companyApi'
import type { ApiError } from '../api/http'
import { isMockAuthMode } from '../auth/mockJwt'
import { registerCompanyDemo } from '../data/storage'

const ROLES: Role[] = ['shipper', 'company', 'admin']

const ROLE_LABELS: Record<Role, string> = {
  shipper: 'Shipper',
  company: 'Company',
  admin: 'Admin',
}

const ROLE_DASHBOARDS: Record<Role, string> = {
  shipper: '/',
  company: '/company/dashboard',
  admin: '/admin/companies',
}

const ROLE_REGISTER_DESCRIPTIONS: Record<Role, string> = {
  shipper: 'Create your account to post loads and manage shipments',
  company: 'Register your company to manage trucks and shipments',
  admin: 'Admin accounts are created by your team (not self-registered)',
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

export default function Register() {
  const { role: urlRole } = useParams<{ role: string }>()
  const role = (ROLES.includes(urlRole as Role) ? urlRole : 'shipper') as Role
  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Company registration fields (backend-aligned)
  const [companyName, setCompanyName] = useState('')
  const [rdbNumber, setRdbNumber] = useState('')
  const [contactPerson, setContactPerson] = useState('')
  const [phone, setPhone] = useState('')
  const [baseDistrict, setBaseDistrict] = useState('')
  const [businessCertPath, setBusinessCertPath] = useState('')
  const [insuranceDocPath, setInsuranceDocPath] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const { login, user } = useAuth()
  const dashboard = ROLE_DASHBOARDS[role]
  const hasToken = Boolean(user?.token)
  const isLoggedInForThisRole = user?.role === role && (role === 'shipper' || hasToken)
  const isShipperPage = role === 'shipper'
  const isCompanyPage = role === 'company'

  useEffect(() => {
    if (!isLoggedInForThisRole) return
    if (location.pathname !== dashboard) navigate(dashboard, { replace: true })
  }, [isLoggedInForThisRole, navigate, dashboard, location.pathname])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (role === 'admin') {
      setError('Admin accounts are not self-registered. Use the admin sign-in page with credentials provided by your team.')
      navigate('/login/admin', {
        replace: true,
        state: {
          registeredMessage:
            'Admin accounts are pre-seeded. Sign in with your admin email and password.',
        },
      })
      return
    }

    if (role === 'company') {
      const email = username.trim()
      if (!email) {
        setError('Enter your company email.')
        return
      }
      if (!email.includes('@')) {
        setError('Use a valid email address (include @).')
        return
      }
      if (!password.trim()) {
        setError('Choose a password.')
        return
      }
      const name = companyName.trim() || fullName.trim()
      if (!name) {
        setError('Enter your company name.')
        return
      }
      if (!rdbNumber.trim() || !contactPerson.trim() || !phone.trim() || !baseDistrict.trim()) {
        setError('Fill in RDB number, contact person, phone, and base district.')
        return
      }
      setBusy(true)
      try {
        if (isMockAuthMode()) {
          registerCompanyDemo({
            email,
            name,
            rdbNumber: rdbNumber.trim(),
            contactPerson: contactPerson.trim(),
            baseDistrict: baseDistrict.trim(),
          })
          navigate('/login/company', {
            replace: true,
            state: {
              registered: true,
              registeredMessage:
                'Demo company registered and queued for approval. You can sign in now; the admin can approve you in “Company checks”.',
            },
          })
        } else {
          await companyRegister({
            email,
            password,
            name,
            rdb_number: rdbNumber.trim(),
            contact_person: contactPerson.trim(),
            phone: phone.trim(),
            base_district: baseDistrict.trim(),
            business_cert_url: businessCertPath.trim(),
            insurance_doc_url: insuranceDocPath.trim(),
          })
          navigate('/login/company', {
            replace: true,
            state: {
              registered: true,
              registeredMessage:
                'Company registered. You can sign in after an admin approves your account.',
            },
          })
        }
      } catch (err) {
        const e = err as ApiError
        setError(e.message || 'Could not register company.')
      } finally {
        setBusy(false)
      }
      return
    }

    if (!username.trim()) {
      setError('Enter a username.')
      return
    }

    login(username.trim(), role)
    navigate(dashboard, { replace: true })
  }

  const formCard = (
    <div className="w-full max-w-md mx-auto ll-animate-in">
      <div className="bg-white rounded-3xl shadow-xl shadow-stone-200/50 border border-stone-100 p-8 sm:p-10 transition-shadow duration-200 hover:shadow-2xl">
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
            <label htmlFor="username" className="block text-sm font-semibold text-stone-700 mb-2">
              {role === 'company' ? 'Company email' : 'Username'}
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              placeholder={role === 'company' ? 'e.g. company@example.com' : 'e.g. alice'}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
            />
          </div>
          {role !== 'company' ? (
            <div>
              <label htmlFor="fullName" className="block text-sm font-semibold text-stone-700 mb-2">
                Full name <span className="text-stone-400 font-medium">(optional)</span>
              </label>
              <input
                id="fullName"
                type="text"
                placeholder="e.g. Alice N."
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label htmlFor="companyName" className="block text-sm font-semibold text-stone-700 mb-2">
                  Company name
                </label>
                <input
                  id="companyName"
                  type="text"
                  placeholder="e.g. Express Logistics Rwanda"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                />
              </div>
              <div>
                <label htmlFor="rdbNumber" className="block text-sm font-semibold text-stone-700 mb-2">
                  RDB number
                </label>
                <input
                  id="rdbNumber"
                  type="text"
                  placeholder="e.g. RDB-2024-001"
                  value={rdbNumber}
                  onChange={(e) => setRdbNumber(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                />
              </div>
              <div>
                <label htmlFor="baseDistrict" className="block text-sm font-semibold text-stone-700 mb-2">
                  Base district
                </label>
                <input
                  id="baseDistrict"
                  type="text"
                  placeholder="e.g. Kigali"
                  value={baseDistrict}
                  onChange={(e) => setBaseDistrict(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                />
              </div>
              <div>
                <label htmlFor="contactPerson" className="block text-sm font-semibold text-stone-700 mb-2">
                  Contact person
                </label>
                <input
                  id="contactPerson"
                  type="text"
                  placeholder="e.g. Jean Paul"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-semibold text-stone-700 mb-2">
                  Phone
                </label>
                <input
                  id="phone"
                  type="text"
                  placeholder="e.g. +250780000000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="businessCertPath" className="block text-sm font-semibold text-stone-700 mb-2">
                  Business certificate path
                </label>
                <input
                  id="businessCertPath"
                  type="text"
                  placeholder="e.g. path/to/cert.pdf"
                  value={businessCertPath}
                  onChange={(e) => setBusinessCertPath(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="insuranceDocPath" className="block text-sm font-semibold text-stone-700 mb-2">
                  Insurance document path
                </label>
                <input
                  id="insuranceDocPath"
                  type="text"
                  placeholder="e.g. path/to/insurance.pdf"
                  value={insuranceDocPath}
                  onChange={(e) => setInsuranceDocPath(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                />
              </div>
            </div>
          )}
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-stone-700 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full py-3.5 bg-accent text-white font-semibold rounded-xl hover:bg-accent-hover transition-all shadow-lg shadow-accent/25 hover:shadow-xl hover:shadow-accent/30 hover:-translate-y-0.5 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {busy ? 'Creating…' : 'Create account'}
          </button>
        </form>
        {error && (
          <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            {error}
          </p>
        )}
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
              Join Rwanda&apos;s logistics marketplace
            </h2>
            <p className="text-white/90 text-lg max-w-sm">
              Create your shipper account to post loads, receive offers from verified transport companies, and manage shipments in one place.
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
            After registering you&apos;ll go to the home page signed in as a shipper (demo).
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
              Join as a transport company
            </h2>
            <p className="text-white/90 text-lg max-w-sm">
              Register to receive shipment requests from shippers, submit offers, and manage your trucks on Rwanda&apos;s logistics marketplace.
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
            After a successful registration you&apos;ll go to company sign-in to use your account.
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
