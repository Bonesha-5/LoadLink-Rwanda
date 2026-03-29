import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { path: '/profile',       label: 'Dashboard',      icon: DashboardIcon },
  { path: '/post-shipment', label: 'Post Shipment',  icon: PackageIcon },
  { path: '/loads',         label: 'My Shipments',   icon: ListIcon },
  { path: '/payments',      label: 'Payments',       icon: PaymentsIcon },
]

function DashboardIcon() {
  return (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  )
}

function PackageIcon() {
  return (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
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

function PaymentsIcon() {
  return (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  )
}

function TruckIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13" />
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  )
}

function AdminIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}


function LogoutIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

  const handleLogout = () => { navigate('/', { replace: true }); logout() }

  return (
    <div className="flex min-h-screen bg-sand">
      {/* Sidebar */}
      <aside className="w-[252px] hidden md:flex flex-col flex-shrink-0 bg-white border-r border-stone-200 text-stone-800 shadow-sm">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-stone-100">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-300 to-amber-500 text-slate-900 shadow-md flex items-center justify-center flex-shrink-0">
              <TruckIcon />
            </div>
            <span className="text-sm font-bold tracking-tight text-stone-900 group-hover:text-stone-700">
              LoadLink Rwanda
            </span>
          </Link>
        </div>

        {/* Dashboard label */}
        <div className="px-5 pt-5 pb-2">
          <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400">
            Shipper Dashboard
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 pb-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path ||
              (item.path === '/loads' && location.pathname.startsWith('/shipment'))
            const Icon = item.icon
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm border transition-all ${
                  isActive
                    ? 'bg-accent/10 text-accent border-accent/20 shadow-sm'
                    : 'text-stone-700 border-transparent hover:bg-stone-50 hover:text-stone-900'
                }`}
              >
                <Icon />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 pb-5 border-t border-stone-100 pt-4">
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-stone-600 hover:bg-stone-50 text-sm font-semibold transition-colors"
          >
            <LogoutIcon /> Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-50 to-white">
        {/* Top bar */}
        <header className="bg-white/90 backdrop-blur border-b border-stone-200 px-6 py-3 flex items-center justify-between gap-3 sticky top-0 z-10">
          {/* Mobile logo */}
          <Link to="/" className="md:hidden text-base font-bold text-sidebar tracking-tight">
            LoadLink Rwanda
          </Link>

          <div className="hidden md:block" />

          <div className="flex items-center gap-3">
            {/* Bell */}
            <button type="button" className="w-9 h-9 rounded-full border border-stone-200 flex items-center justify-center text-stone-500 hover:bg-slate-50 transition-colors relative">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            {/* User badge */}
            <div className="flex items-center gap-2 rounded-full border border-stone-200 bg-slate-50 px-3 py-1.5 shadow-sm">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center text-white text-[10px] font-bold">
                {(user?.name?.[0] ?? 'S').toUpperCase()}
              </div>
              <span className="text-sm font-semibold text-stone-800 hidden sm:block">
                {user?.name || 'Shipper'}
              </span>
            </div>
            {/* Logout */}
            <button
              type="button"
              onClick={handleLogout}
              className="text-xs text-stone-500 hover:text-stone-900 font-semibold transition-colors"
            >
              Logout
            </button>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-5 md:px-8 py-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
