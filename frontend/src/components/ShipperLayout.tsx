import { useEffect, useRef, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

type Notif = { id: string; message: string; read: boolean; createdAt: string }

function getNotifications(): Notif[] {
  try { return JSON.parse(localStorage.getItem('ll_notifications') ?? '[]') } catch { return [] }
}
function markAllRead(notifs: Notif[]) {
  const updated = notifs.map((n) => ({ ...n, read: true }))
  localStorage.setItem('ll_notifications', JSON.stringify(updated))
  return updated
}

const navItems = [
  { path: '/profile',       label: 'Dashboard',      icon: DashboardIcon },
  { path: '/post-shipment', label: 'Post Shipment',  icon: PackageIcon },
  { path: '/loads',         label: 'My Shipments',   icon: ListIcon },
  { path: '/payments',      label: 'Payments',       icon: PaymentsIcon },
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

  const [notifs, setNotifs]       = useState<Notif[]>([])
  const [showNotif, setShowNotif] = useState(false)
  const bellRef                   = useRef<HTMLDivElement>(null)
  const unread                    = notifs.filter((n) => !n.read).length

  useEffect(() => { setNotifs(getNotifications()) }, [location.pathname])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setShowNotif(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const handleLogout = () => { logout(); navigate('/') }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-[280px] hidden md:flex flex-col flex-shrink-0 bg-white border-r border-stone-200">
        {/* Logo */}
        <div className="px-6 py-6">
          <Link to="/" className="block">
            <h1 className="text-lg font-bold tracking-tight text-stone-900">LoadLink Rwanda</h1>
            <span className="text-sm text-stone-500 mt-1 block">Shipper portal</span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 flex flex-col px-4 pb-4">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wide text-stone-400 mb-2">Menu</p>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path ||
              (item.path === '/loads' && location.pathname.startsWith('/shipment'))
            const Icon = item.icon
            return (
              <Link
                key={item.path}
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

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-5 md:px-8 py-6 space-y-6">
          {/* Header */}
          <header className="flex flex-wrap items-center justify-between gap-3">
            {/* Mobile logo */}
            <div className="md:hidden">
              <Link to="/" className="text-lg font-bold tracking-tight text-stone-900">
                LoadLink Rwanda
              </Link>
              <p className="text-xs text-stone-500">Shipper portal</p>
            </div>

            <div className="flex-1 flex items-center justify-end md:justify-between gap-3">
              {/* Search bar (desktop) */}
              <div className="hidden md:block w-full max-w-md">
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-stone-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
                    </svg>
                  </span>
                  <input
                    placeholder="Search shipments, routes…"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-stone-200 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </div>
              </div>

              {/* Bell + User badge */}
              <div className="flex items-center gap-2">
                {/* Notification bell */}
                <div className="relative" ref={bellRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNotif((v) => !v)
                      if (!showNotif) setNotifs(markAllRead(notifs))
                    }}
                    className="w-9 h-9 rounded-full border border-stone-200 bg-white flex items-center justify-center text-stone-500 hover:bg-stone-50 transition-colors relative"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {unread > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white text-[9px] font-bold flex items-center justify-center">
                        {unread > 9 ? '9+' : unread}
                      </span>
                    )}
                  </button>
                  {showNotif && (
                    <div className="absolute right-0 top-11 w-80 bg-white border border-stone-200 rounded-2xl shadow-xl z-50 overflow-hidden">
                      <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between">
                        <p className="text-sm font-bold text-stone-900">Notifications</p>
                        {notifs.length > 0 && (
                          <button type="button" onClick={() => { localStorage.setItem('ll_notifications', '[]'); setNotifs([]) }} className="text-xs text-stone-400 hover:text-red-500 transition-colors">Clear all</button>
                        )}
                      </div>
                      {notifs.length === 0 ? (
                        <p className="px-4 py-6 text-sm text-stone-400 text-center">No notifications</p>
                      ) : (
                        <ul className="max-h-72 overflow-y-auto divide-y divide-stone-100">
                          {notifs.map((n) => (
                            <li key={n.id} className="px-4 py-3 flex items-start gap-3">
                              <span className="mt-1 w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                              <div>
                                <p className="text-xs text-stone-800 leading-snug">{n.message}</p>
                                <p className="text-[10px] text-stone-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>

                {/* User badge */}
                <span className="hidden sm:inline-flex items-center gap-2 rounded-2xl bg-white border border-stone-200 px-3 py-2">
                  <span className="w-7 h-7 rounded-xl bg-accent/10 text-accent flex items-center justify-center text-xs font-bold">
                    {(user?.name?.[0] ?? 'S').toUpperCase()}
                  </span>
                  <span className="text-sm font-semibold text-stone-800">
                    {user?.name || 'Shipper'}
                  </span>
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
