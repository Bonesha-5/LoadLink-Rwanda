import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { path: '/admin/companies', label: 'Company Verification', icon: BuildingIcon },
  { path: '/admin/shipments', label: 'Shipment Monitoring', icon: ShipmentIcon },
  { path: '/admin/disputes', label: 'Dispute Resolution', icon: DisputeIcon },
  { path: '/admin/audit-log', label: 'Audit Log', icon: ListIcon },
]

function BuildingIcon() {
  return (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="18" rx="1" />
      <rect x="14" y="7" width="7" height="14" rx="1" />
      <path d="M9 9h1M9 13h1M9 17h1M18 11h1M18 15h1" />
    </svg>
  )
}

function ShipmentIcon() {
  return (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13" />
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  )
}

function DisputeIcon() {
  return (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16v12H5.17L4 17.17V4z" />
      <path d="M12 8v4M12 14h.01" />
    </svg>
  )
}

function ListIcon() {
  return (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

export default function AdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuth()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-[260px] flex flex-col flex-shrink-0 bg-sidebar text-white shadow-xl">
        <div className="px-6 py-6 border-b border-white/10">
          <div>
            <h1 className="text-lg font-bold tracking-tight hover:text-white/90 transition-colors">
              LoadLink Rwanda
            </h1>
            <span className="text-sm text-white/70 mt-1 block">Admin Portal</span>
          </div>
        </div>

        <nav className="flex-1 flex flex-col py-4 px-3">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            const Icon = item.icon
            return (
              <Link
                key={item.path + item.label}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-all relative ${
                  isActive
                    ? 'text-accent bg-sidebar-hover'
                    : 'text-white/85 hover:bg-sidebar-hover hover:text-white'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-accent rounded-r" />
                )}
                <Icon />
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          })}
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-lg mt-auto w-full text-left text-white/60 hover:bg-sidebar-hover hover:text-white transition-all"
          >
            <LogoutIcon />
            <span>Logout</span>
          </button>
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto bg-sand p-8 relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-accent/5 blur-3xl" />
          <div className="absolute bottom-20 left-0 w-72 h-72 rounded-full bg-sidebar/5 blur-2xl" />
        </div>
        <div className="relative z-10 space-y-6">
          <header className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <div>
              <h2 className="text-lg font-semibold text-stone-900">
                Admin Panel
              </h2>
              <p className="text-sm text-stone-500">
                Oversight for companies, shipments, disputes, and audit logs.
              </p>
            </div>
          </header>
          <Outlet />
        </div>
      </main>
    </div>
  )
}