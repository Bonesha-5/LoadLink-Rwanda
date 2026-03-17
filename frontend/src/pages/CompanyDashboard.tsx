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

  const { truckCount, openLoadsCount } = useMemo(() => {
    void refresh
    ensureSeedLoads()
    return {
      truckCount: getTrucksByCompany(companyName).length,
      openLoadsCount: getAllLoads().filter((l) => l.status === 'open').length,
    }
  }, [companyName, refresh])

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-stone-800 mb-1">
        Welcome, {user?.name}
      </h1>
      <p className="text-stone-600 mb-6">
        Rwanda&apos;s premier logistics marketplace. Get shipment requests from shippers, submit competitive offers, and grow your transport business.
      </p>
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-sidebar/5 flex items-center justify-center text-sidebar">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="1" y="3" width="15" height="13" />
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
              <circle cx="5.5" cy="18.5" r="2.5" />
              <circle cx="18.5" cy="18.5" r="2.5" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
              Trucks in fleet
            </p>
            <p className="text-2xl font-bold text-stone-900">
              {truckCount}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-accent/5 flex items-center justify-center text-accent">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M5 7v10a2 2 0 002 2h10a2 2 0 002-2V7M9 11h6" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
              Open shipments
            </p>
            <p className="text-2xl font-bold text-stone-900">
              {openLoadsCount}
            </p>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-4">
        <Link
          to="/company/shipments"
          className="inline-flex items-center gap-2 px-6 py-3.5 bg-accent text-white font-semibold rounded-xl hover:bg-accent-hover transition-all shadow-lg hover:shadow-accent/25"
        >
          <span aria-hidden>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </span>
          View Shipments
        </Link>
        <Link
          to="/company/trucks"
          className="inline-flex items-center gap-2 px-6 py-3.5 bg-white border-2 border-stone-200 text-stone-800 font-semibold rounded-xl hover:border-stone-300 hover:bg-stone-50 transition-all"
        >
          <span aria-hidden>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="1" y="3" width="15" height="13" />
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
              <circle cx="5.5" cy="18.5" r="2.5" />
              <circle cx="18.5" cy="18.5" r="2.5" />
            </svg>
          </span>
          Manage Trucks
        </Link>
        <button
          type="button"
          onClick={() => setRefresh((v) => v + 1)}
          className="text-stone-500 text-sm hover:text-stone-700 hover:underline"
        >
          Refresh stats
        </button>
      </div>
      <section className="mt-8">
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-stone-800">Track fleet movement</h2>
            <p className="text-sm text-stone-600">
              Open a live map view showing where your trucks are operating across Rwanda.
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
            View fleet map
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
