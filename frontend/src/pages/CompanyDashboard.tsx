import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getTrucksByCompany, getAllLoads, ensureSeedLoads } from '../data/storage'
import CompanyFleetMap from '../components/CompanyFleetMap'

export default function CompanyDashboard() {
  const { user } = useAuth()
  const companyName = user?.name ?? ''
  const [refresh, setRefresh] = useState(0)
  const [showFleetMap, setShowFleetMap] = useState(false)

  const demoFleet = [
    { id: 'T1', position: [-1.95, 30.06] },  // Kigali
    { id: 'T2', position: [-1.7, 29.26] },   // Gisenyi
    { id: 'T3', position: [-2.6, 29.73] },   // Butare-ish
  ]

  const { truckCount, openLoadsCount, recentOpenLoads, totalOpenOffers } = useMemo(() => {
    void refresh
    ensureSeedLoads()
    const loads = getAllLoads()
    const openLoads = loads.filter((l) => l.status === 'open')
    return {
      truckCount: getTrucksByCompany(companyName).length,
      openLoadsCount: openLoads.length,
      recentOpenLoads: openLoads.slice(0, 4),
      totalOpenOffers: openLoads.reduce((sum, l) => sum + (l.offers?.length ?? 0), 0),
    }
  }, [companyName, refresh])

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">
            Welcome back{user?.name ? `, ${user.name}` : ''}
          </h1>
          <p className="text-sm text-stone-600 mt-1">
            Today&apos;s snapshot of your fleet and the marketplace.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setRefresh((v) => v + 1)}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-600 hover:text-stone-900 hover:underline"
        >
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
          Refresh
        </button>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
              Trucks
            </p>
            <p className="text-2xl font-bold text-stone-900">{truckCount}</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-sidebar/5 flex items-center justify-center text-sidebar">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="1" y="3" width="15" height="13" />
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
              <circle cx="5.5" cy="18.5" r="2.5" />
              <circle cx="18.5" cy="18.5" r="2.5" />
            </svg>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
              Open shipments
            </p>
            <p className="text-2xl font-bold text-stone-900">{openLoadsCount}</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M5 7v10a2 2 0 002 2h10a2 2 0 002-2V7M9 11h6" />
            </svg>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
              Offers on open loads
            </p>
            <p className="text-2xl font-bold text-stone-900">{totalOpenOffers}</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-cream flex items-center justify-center text-sidebar border border-stone-200">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h6m-7 9h14a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h2 className="text-sm font-semibold text-stone-800">Quick actions</h2>
              <p className="text-xs text-stone-500 mt-1">
                Jump to the most common tasks.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link
              to="/company/shipments"
              className="group rounded-2xl border border-stone-200 bg-sand p-4 hover:bg-white hover:border-stone-300 transition-all"
            >
              <div className="w-10 h-10 rounded-2xl bg-accent/10 text-accent flex items-center justify-center mb-3 group-hover:bg-accent group-hover:text-white transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-stone-900">Browse shipments</p>
              <p className="text-xs text-stone-500 mt-1">Accept fixed-price loads.</p>
            </Link>

            <Link
              to="/company/trucks"
              className="group rounded-2xl border border-stone-200 bg-sand p-4 hover:bg-white hover:border-stone-300 transition-all"
            >
              <div className="w-10 h-10 rounded-2xl bg-sidebar/5 text-sidebar flex items-center justify-center mb-3 group-hover:bg-sidebar group-hover:text-white transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect x="1" y="3" width="15" height="13" />
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                  <circle cx="5.5" cy="18.5" r="2.5" />
                  <circle cx="18.5" cy="18.5" r="2.5" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-stone-900">Manage fleet</p>
              <p className="text-xs text-stone-500 mt-1">Add, edit, or remove trucks.</p>
            </Link>

            <Link
              to="/company/active-shipments"
              className="group rounded-2xl border border-stone-200 bg-sand p-4 hover:bg-white hover:border-stone-300 transition-all"
            >
              <div className="w-10 h-10 rounded-2xl bg-cream text-sidebar border border-stone-200 flex items-center justify-center mb-3 group-hover:bg-sidebar group-hover:text-white group-hover:border-sidebar transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-stone-900">Active shipments</p>
              <p className="text-xs text-stone-500 mt-1">Track live delivery statuses.</p>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-stone-800">Marketplace snapshot</h2>
          <p className="text-xs text-stone-500 mt-1">
            Latest open loads (demo).
          </p>
          <div className="mt-4 space-y-3">
            {recentOpenLoads.map((l) => (
              <div key={l.id} className="rounded-2xl border border-stone-200 bg-sand p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-stone-900">
                      {l.origin} → {l.destination}
                    </p>
                    <p className="text-xs text-stone-500 mt-1">
                      {new Date(l.date).toLocaleDateString()} · {l.weight}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-accent">
                    {l.price ?? 'Fixed price'}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-stone-500">
                    Posted by {l.createdBy}
                  </span>
                  <Link to="/company/shipments" className="text-xs font-semibold text-stone-700 hover:text-stone-900 hover:underline">
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-8">
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-stone-800">Track fleet movement</h2>
            <p className="text-xs text-stone-500 mt-1">
              Open a map view to see where your trucks are operating (demo).
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowFleetMap(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-white text-sm font-semibold shadow-sm hover:bg-accent-hover transition-all"
          >
            <span aria-hidden>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 7l6-3 6 3 6-3v13l-6 3-6-3-6 3V7z"
                />
              </svg>
            </span>
            View map
          </button>
        </div>
      </section>
      {showFleetMap && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl mx-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-stone-100">
                <div>
                  <h3 className="text-sm font-semibold text-stone-900">Fleet movement (demo)</h3>
                  <p className="text-xs text-stone-500">
                    Simulated truck positions for your company across Rwanda.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFleetMap(false)}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-stone-100 text-stone-500 hover:text-stone-800"
                  aria-label="Close fleet map"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="h-80">
                <CompanyFleetMap trucks={demoFleet} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
