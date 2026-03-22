import { useEffect, useMemo, useState } from 'react'
import { ensureSeedAdminData, getAdminShipments, type ShipmentStatus } from '../data/storage'

type AdminShipment = {
  id: string
  shipperName: string
  pickup: string
  dropoff: string
  weight: string
  price: string
  priceRwf: number
  status: ShipmentStatus
  truckPlate?: string
  companyName?: string
  createdAt: string
}

type FetchState = 'idle' | 'loading' | 'error' | 'success'

const STATUS_LABELS: Record<ShipmentStatus, string> = {
  POSTED: 'Posted',
  AWAITING_ESCROW: 'Awaiting escrow',
  ESCROW_FUNDED: 'Escrow funded',
  IN_TRANSIT: 'In transit',
  AWAITING_CONFIRMATION: 'Awaiting confirmation',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  DISPUTED: 'Disputed',
}

/** LoadLink-aligned: accent, sidebar, stone — avoid random greens */
const STATUS_CLASSES: Record<ShipmentStatus, string> = {
  POSTED: 'bg-stone-100 text-stone-800 border border-stone-200',
  AWAITING_ESCROW: 'bg-accent/10 text-sidebar border border-accent/25',
  ESCROW_FUNDED: 'bg-cream text-sidebar border border-stone-200',
  IN_TRANSIT: 'bg-accent/15 text-sidebar border border-accent/30',
  AWAITING_CONFIRMATION: 'bg-stone-50 text-stone-800 border border-stone-200',
  COMPLETED: 'bg-sidebar text-white border border-stone-800',
  CANCELLED: 'bg-stone-200 text-stone-700 border border-stone-300',
  DISPUTED: 'bg-red-50 text-red-800 border border-red-100',
}

const STATUS_FILTER_OPTIONS: (ShipmentStatus | 'ALL')[] = [
  'ALL',
  'POSTED',
  'AWAITING_ESCROW',
  'ESCROW_FUNDED',
  'IN_TRANSIT',
  'AWAITING_CONFIRMATION',
  'COMPLETED',
  'CANCELLED',
  'DISPUTED',
]

const ACTIVE_STATUSES: ShipmentStatus[] = ['ESCROW_FUNDED', 'IN_TRANSIT', 'AWAITING_CONFIRMATION']

function relativeTime(iso: string): string {
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  const hrs = Math.floor(diff / 3_600_000)
  const days = Math.floor(diff / 86_400_000)
  if (hrs < 24) return `${hrs}h ago`
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function RouteArrow() {
  return (
    <span className="inline-flex items-center justify-center shrink-0 text-accent" aria-hidden>
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
      </svg>
    </span>
  )
}

function TruckIcon() {
  return (
    <svg className="w-4 h-4 text-stone-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
    </svg>
  )
}

export default function AdminShipmentMonitoring() {
  const [allShipments, setAllShipments] = useState<AdminShipment[]>([])
  const [state, setState] = useState<FetchState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<ShipmentStatus | 'ALL'>('ALL')
  const [query, setQuery] = useState('')

  async function loadShipments() {
    setState('loading')
    setError(null)
    try {
      ensureSeedAdminData()
      const data = getAdminShipments().map(
        (s): AdminShipment => ({
          id: s.id,
          shipperName: s.shipperName,
          pickup: s.pickupDistrict,
          dropoff: s.dropoffDistrict,
          weight: `${s.weightTons} tons`,
          price: `${s.offeredPriceRwf.toLocaleString()} RWF`,
          priceRwf: s.offeredPriceRwf,
          status: s.status,
          truckPlate: s.truckPlate,
          companyName: s.companyName,
          createdAt: s.createdAt,
        }),
      )
      setAllShipments(data)
      setState('success')
    } catch (err) {
      console.error(err)
      setAllShipments([])
      setError('Could not load shipments from local demo data.')
      setState('error')
    }
  }

  useEffect(() => {
    void loadShipments()
  }, [])

  const filteredShipments = useMemo(() => {
    const q = query.trim().toLowerCase()
    return allShipments.filter((s) => {
      if (filter !== 'ALL' && s.status !== filter) return false
      if (!q) return true
      const blob = `${s.id} ${s.shipperName} ${s.pickup} ${s.dropoff} ${s.companyName ?? ''} ${s.truckPlate ?? ''}`.toLowerCase()
      return blob.includes(q)
    })
  }, [allShipments, filter, query])

  const kpis = useMemo(() => {
    const active = allShipments.filter((s) => ACTIVE_STATUSES.includes(s.status)).length
    const disputed = allShipments.filter((s) => s.status === 'DISPUTED').length
    const totalValue = allShipments.reduce((sum, s) => sum + s.priceRwf, 0)
    return {
      total: allShipments.length,
      active,
      disputed,
      totalValue,
    }
  }, [allShipments])

  return (
    <div className="space-y-8 ll-animate-in max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Operations</p>
          <h1 className="text-2xl font-bold text-stone-900 mt-1">Shipment monitoring</h1>
          <p className="text-sm text-stone-600 mt-1 max-w-xl">
            Live view of every shipment on the platform — route, carrier, escrow stage, and health at a glance.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadShipments()}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-sidebar text-white text-sm font-semibold hover:bg-stone-800 transition-colors shadow-sm border border-stone-800"
        >
          <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-3xl border border-stone-200 bg-white p-4 sm:p-5 shadow-sm">
          <p className="text-xs font-semibold text-stone-500">Total shipments</p>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-stone-900 tabular-nums">{kpis.total}</p>
        </div>
        <div className="rounded-3xl border border-stone-200 bg-white p-4 sm:p-5 shadow-sm ring-1 ring-accent/15">
          <p className="text-xs font-semibold text-stone-500">Active pipeline</p>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-accent tabular-nums">{kpis.active}</p>
          <p className="mt-1 text-[11px] text-stone-500">Funded · transit · confirmation</p>
        </div>
        <div className="rounded-3xl border border-stone-200 bg-white p-4 sm:p-5 shadow-sm">
          <p className="text-xs font-semibold text-stone-500">Open disputes</p>
          <p className="mt-2 text-2xl sm:text-3xl font-bold text-stone-900 tabular-nums">{kpis.disputed}</p>
        </div>
        <div className="rounded-3xl border border-stone-200 bg-white p-4 sm:p-5 shadow-sm col-span-2 lg:col-span-1">
          <p className="text-xs font-semibold text-stone-500">Listed value (demo)</p>
          <p className="mt-2 text-lg sm:text-xl font-bold text-stone-900 tabular-nums leading-tight">
            {kpis.totalValue.toLocaleString()} <span className="text-stone-500 font-semibold text-sm">RWF</span>
          </p>
        </div>
      </section>

      <div className="space-y-4">
        <div className="relative max-w-md">
          <span className="absolute inset-y-0 left-3 flex items-center text-stone-400 pointer-events-none">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
            </svg>
          </span>
          <input
            type="search"
            placeholder="Search ID, shipper, route, company, plate…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-stone-200 bg-white text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {STATUS_FILTER_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setFilter(option)}
              className={[
                'shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border whitespace-nowrap',
                filter === option
                  ? 'bg-accent text-sidebar border-accent shadow-sm'
                  : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300',
              ].join(' ')}
            >
              {option === 'ALL' ? 'All' : STATUS_LABELS[option]}
            </button>
          ))}
        </div>
      </div>

      {state === 'loading' && (
        <div className="flex items-center gap-3 text-stone-500 text-sm py-12">
          <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          Loading shipments…
        </div>
      )}

      {state === 'error' && error && (
        <p className="text-red-600 text-sm rounded-2xl border border-red-100 bg-red-50 px-4 py-3">{error}</p>
      )}

      {state === 'success' && filteredShipments.length === 0 && (
        <div className="rounded-3xl border border-dashed border-stone-200 bg-stone-50/80 p-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white border border-stone-200 text-accent">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V7a2 2 0 00-2-2H6a2 2 0 00-2 2v6m16 0v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4m16 0h-2M4 13h2m0 0V9a2 2 0 012-2h2m-4 6h4" />
            </svg>
          </div>
          <p className="text-stone-800 font-semibold">No shipments match</p>
          <p className="text-sm text-stone-500 mt-2">Try another status or clear your search.</p>
        </div>
      )}

      {state === 'success' && filteredShipments.length > 0 && (
        <ul className="space-y-4">
          {filteredShipments.map((s) => (
            <li
              key={s.id}
              className="group rounded-3xl border border-stone-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-stone-300"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono text-xs font-semibold text-stone-500 bg-stone-100 px-2.5 py-1 rounded-lg border border-stone-200">
                    {s.id}
                  </span>
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_CLASSES[s.status]}`}
                  >
                    {STATUS_LABELS[s.status]}
                  </span>
                </div>
                <div className="text-right text-xs text-stone-500">
                  <span className="font-semibold text-accent">{relativeTime(s.createdAt)}</span>
                  <p className="mt-0.5 text-[11px] text-stone-400">{new Date(s.createdAt).toLocaleString()}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-5">
                <span className="text-lg font-bold text-stone-900">{s.pickup}</span>
                <RouteArrow />
                <span className="text-lg font-bold text-stone-900">{s.dropoff}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">Shipper</p>
                  <p className="font-semibold text-stone-900">{s.shipperName}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">Carrier</p>
                  <p className="font-semibold text-stone-900">{s.companyName ?? '— Unassigned'}</p>
                </div>
                <div className="flex items-start gap-2">
                  <TruckIcon />
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">Truck</p>
                    <p className="font-mono text-stone-800">{s.truckPlate ?? '—'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">Cargo</p>
                  <p className="text-stone-800">{s.weight}</p>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-stone-100 flex flex-wrap items-end justify-between gap-2">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">Offered price</p>
                  <p className="text-xl font-bold text-sidebar">{s.price}</p>
                </div>
                <span className="text-[11px] text-stone-400 max-w-[200px] text-right">
                  Demo data · amounts mirror shipper offers
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-stone-500 border-t border-stone-200 pt-6">
        Shipment records are loaded from your browser’s demo store. Connect a real API to power live updates and
        pagination.
      </p>
    </div>
  )
}
