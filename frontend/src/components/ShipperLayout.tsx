import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { path: '/profile', label: 'Dashboard', icon: DashboardIcon },
  { path: '/post-shipment', label: 'Post Shipment', icon: TruckIcon },
  { path: '/loads', label: 'My Shipments', icon: ListIcon },
  { path: '/interested-trucks', label: 'Interested Trucks', icon: ProfileIcon },
  { path: '/payments', label: 'Payments', icon: WalletIcon },
  { path: '/ratings', label: 'Ratings', icon: StarIcon },
]

function DashboardIcon() {
  return (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  )
}

function TruckIcon() {
  return (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13" />
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  )
}

function ListIcon() {
  return (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  )
}

function ProfileIcon() {
  return (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function WalletIcon() {
  return (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7a2 2 0 0 1 2-2h14a1 1 0 0 1 0 2H5v10h14a1 1 0 0 0 1-1v-6a1 1 0 0 0-1-1H5" />
      <path d="M15 13h3" />
    </svg>
  )
}

function StarIcon() {
  return (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z" />
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

export default function ShipperLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout, user } = useAuth()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-[280px] hidden md:flex flex-col flex-shrink-0 bg-white border-r border-stone-200">
        <div className="px-6 py-6">
          <Link to="/" className="block">
            <h1 className="text-lg font-bold tracking-tight text-stone-900">LoadLink Rwanda</h1>
            <span className="text-sm text-stone-500 mt-1 block">Shipper portal</span>
          </Link>
        </div>

        <nav className="flex-1 flex flex-col px-4 pb-4">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wide text-stone-400 mb-2">
            Menu
          </p>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            const Icon = item.icon
            return (
              <Link
                key={item.path + item.label}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-3 rounded-2xl mb-2 transition-all border ${
                  isActive
                    ? 'bg-accent/10 border-accent/20 text-accent'
                    : 'bg-white border-transparent text-stone-700 hover:bg-stone-50'
                }`}
              >
                <Icon />
                <span className="font-semibold text-sm">{item.label}</span>
              </Link>
            )
          })}
          <button
            type="button"
            onClick={handleLogout}
            className="mt-auto flex items-center gap-3 px-3 py-3 rounded-2xl w-full text-left text-stone-600 hover:bg-stone-50 transition-all"
          >
            <LogoutIcon />
            <span className="font-semibold text-sm">Logout</span>
          </button>
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-5 md:px-8 py-6 space-y-6">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <div className="md:hidden">
              <Link to="/" className="text-lg font-bold tracking-tight text-stone-900">
                LoadLink Rwanda
              </Link>
              <p className="text-xs text-stone-500">Shipper portal</p>
            </div>

            <div className="flex-1 flex items-center justify-end md:justify-between gap-3">
              <div className="hidden md:block w-full max-w-md">
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-stone-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
                    </svg>
                  </span>
                  <input
                    placeholder="Search shipments, routes…"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-stone-200 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-shadow"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-flex items-center gap-2 rounded-2xl bg-white border border-stone-200 px-3 py-2">
                  <span className="w-7 h-7 rounded-xl bg-accent/10 text-accent flex items-center justify-center text-xs font-bold">
                    {(user?.name?.[0] ?? 'S').toUpperCase()}
                  </span>
                  <span className="text-sm font-semibold text-stone-800">
                    {user?.name || 'Shipper'}
                  </span>
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-cream text-sidebar px-3 py-1 text-xs font-semibold border border-stone-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                  Active
                </span>
              </div>
            </div>
          </header>

          <Outlet />
        </div>
      </main>
    </div>
  )
}
