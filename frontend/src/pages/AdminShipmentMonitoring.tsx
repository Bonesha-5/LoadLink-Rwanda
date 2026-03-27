import { useEffect, useMemo, useState } from 'react'
import { ensureSeedAdminData, getAdminShipments, type ShipmentStatus } from '../data/storage'
import { useAuth } from '../context/AuthContext'
import { getAdminShipmentsApi, type AdminShipmentDto, type ShipmentStatus as ApiShipmentStatus } from '../api/adminOpsApi'
import type { ApiError } from '../api/http'
import { getApiToken } from '../auth/mockJwt'

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
  AWAITING_ESCROW: 'Waiting for payment',
  ESCROW_FUNDED: 'Payment received',
  IN_TRANSIT: 'On the way',
  AWAITING_CONFIRMATION: 'Waiting for confirmation',
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

export default function AdminShipmentMonitoring() {
  const { user } = useAuth()
  const token = getApiToken(user?.token ?? null)
  const [allShipments, setAllShipments] = useState<AdminShipment[]>([])
  const [state, setState] = useState<FetchState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<ShipmentStatus | 'ALL'>('ALL')
  const [query, setQuery] = useState('')

  async function loadShipments() {
    setState('loading')
    setError(null)
    try {
      if (token) {
        const apiStatus = filter === 'ALL' ? undefined : (filter as unknown as ApiShipmentStatus)
        const apiData = await getAdminShipmentsApi(token, apiStatus)
        const data = apiData.map(
          (s: AdminShipmentDto): AdminShipment => ({
            id: String(s.id),
            shipperName: s.shipperName ?? s.shipper_name ?? '—',
            pickup: s.pickupDistrict ?? s.pickup_district ?? '—',
            dropoff: s.dropoffDistrict ?? s.dropoff_district ?? '—',
            weight: `${s.weightTons ?? s.weight_tons ?? '—'} tons`,
            price: `${(s.offeredPriceRwf ?? s.offered_price_rwf ?? 0).toLocaleString()} RWF`,
            priceRwf: s.offeredPriceRwf ?? s.offered_price_rwf ?? 0,
            status: s.status as any,
            truckPlate: s.truckPlate ?? s.truck_plate,
            companyName: s.companyName ?? s.company_name,
            createdAt: s.createdAt ?? s.created_at ?? new Date().toISOString(),
          }),
        )
        setAllShipments(data)
        setState('success')
        return
      }

      ensureSeedAdminData()
      const data = getAdminShipments().map((s): AdminShipment => ({
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
      }))
      setAllShipments(data)
      setState('success')
    } catch (err) {
      console.error(err)
      setAllShipments([])
      const e = err as ApiError
      setError(token ? (e.message || 'Could not load shipments.') : 'Could not load shipments from local demo data.')
      setState('error')
    }
  }

  useEffect(() => {
    void loadShipments()
  }, [filter, token])

  const filteredShipments = useMemo(() => {
    const q = query.trim().toLowerCase()
    return allShipments.filter((s) => {
      if (filter !== 'ALL' && s.status !== filter) return false
      if (!q) return true
      const blob = `${s.id} ${s.shipperName} ${s.pickup} ${s.dropoff} ${s.companyName ?? ''} ${s.truckPlate ?? ''}`.toLowerCase()
      return blob.includes(q)
    })
  }, [allShipments, filter, query])

  return (
    <div className="space-y-6 ll-animate-in max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Admin</p>
          <h1 className="text-2xl font-bold text-stone-900 mt-1">Shipment monitoring</h1>
          <p className="text-sm text-stone-600 mt-1 max-w-2xl">
            A full list of shipments on the platform. Use the filter to view one status at a time.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadShipments()}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-sidebar text-white text-sm font-semibold hover:bg-stone-800 transition-colors shadow-sm border border-stone-800"
        >
          Refresh
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative max-w-md w-full">
          <span className="absolute inset-y-0 left-3 flex items-center text-stone-400 pointer-events-none">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
            </svg>
          </span>
          <input
            type="search"
            placeholder="Search by ID, shipper, route, company, or plate…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-stone-200 bg-white text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-stone-600">Status</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-3 py-2 rounded-2xl border border-stone-200 bg-white text-sm text-stone-800 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          >
            {STATUS_FILTER_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o === 'ALL' ? 'All' : STATUS_LABELS[o]}
              </option>
            ))}
          </select>
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
        <div className="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="px-4 py-3 font-semibold text-stone-700">Shipment ID</th>
                <th className="px-4 py-3 font-semibold text-stone-700">Shipper</th>
                <th className="px-4 py-3 font-semibold text-stone-700">Pickup</th>
                <th className="px-4 py-3 font-semibold text-stone-700">Dropoff</th>
                <th className="px-4 py-3 font-semibold text-stone-700">Weight</th>
                <th className="px-4 py-3 font-semibold text-stone-700">Price</th>
                <th className="px-4 py-3 font-semibold text-stone-700">Status</th>
                <th className="px-4 py-3 font-semibold text-stone-700">Truck plate</th>
                <th className="px-4 py-3 font-semibold text-stone-700">Company</th>
                <th className="px-4 py-3 font-semibold text-stone-700">Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredShipments.map((s) => (
                <tr key={s.id} className="border-b border-stone-100 last:border-0">
                  <td className="px-4 py-3 font-mono text-xs text-stone-700">{s.id}</td>
                  <td className="px-4 py-3 text-stone-800">{s.shipperName}</td>
                  <td className="px-4 py-3 text-stone-700">{s.pickup}</td>
                  <td className="px-4 py-3 text-stone-700">{s.dropoff}</td>
                  <td className="px-4 py-3 text-stone-700">{s.weight}</td>
                  <td className="px-4 py-3 text-stone-800 font-semibold">{s.price}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_CLASSES[s.status]}`}>
                      {STATUS_LABELS[s.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-stone-700">{s.truckPlate ?? '—'}</td>
                  <td className="px-4 py-3 text-stone-700">{s.companyName ?? '—'}</td>
                  <td className="px-4 py-3 text-xs text-stone-500">{new Date(s.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-stone-500 border-t border-stone-200 pt-6">
        {token
          ? 'Live data from the API.'
          : 'Demo data (local only).'}
      </p>
    </div>
  )
}
