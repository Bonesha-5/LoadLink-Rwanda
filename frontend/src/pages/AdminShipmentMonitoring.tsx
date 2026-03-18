import { useEffect, useState } from 'react'
import { ensureSeedAdminData, getAdminShipments } from '../data/storage'

type ShipmentStatus =
  | 'PENDING'
  | 'ESCROW_FUNDED'
  | 'IN_TRANSIT'
  | 'AWAITING_CONFIRMATION'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'DISPUTED'

type AdminShipment = {
  id: string
  shipperName: string
  pickup: string
  dropoff: string
  weight: string
  price: string
  status: ShipmentStatus
  truckPlate?: string
  companyName?: string
  createdAt: string
}

type FetchState = 'idle' | 'loading' | 'error' | 'success'

const STATUS_LABELS: Record<ShipmentStatus, string> = {
  PENDING: 'Pending',
  ESCROW_FUNDED: 'Escrow funded',
  IN_TRANSIT: 'In transit',
  AWAITING_CONFIRMATION: 'Awaiting confirmation',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  DISPUTED: 'Disputed',
}

const STATUS_CLASSES: Record<ShipmentStatus, string> = {
  PENDING: 'bg-stone-100 text-stone-700',
  ESCROW_FUNDED: 'bg-cream text-sidebar',
  IN_TRANSIT: 'bg-accent/10 text-accent',
  AWAITING_CONFIRMATION: 'bg-amber-50 text-amber-800',
  COMPLETED: 'bg-emerald-50 text-emerald-800',
  CANCELLED: 'bg-stone-200 text-stone-700',
  DISPUTED: 'bg-red-50 text-red-700',
}

const STATUS_FILTER_OPTIONS: (ShipmentStatus | 'ALL')[] = [
  'ALL',
  'PENDING',
  'ESCROW_FUNDED',
  'IN_TRANSIT',
  'AWAITING_CONFIRMATION',
  'COMPLETED',
  'CANCELLED',
  'DISPUTED',
]

export default function AdminShipmentMonitoring() {
  const [shipments, setShipments] = useState<AdminShipment[]>([])
  const [state, setState] = useState<FetchState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<ShipmentStatus | 'ALL'>('ALL')

  async function loadShipments(selectedStatus: ShipmentStatus | 'ALL' = filter) {
    setState('loading')
    setError(null)
    try {
      ensureSeedAdminData()
      const data = getAdminShipments(selectedStatus === 'ALL' ? undefined : selectedStatus).map(
        (s): AdminShipment => ({
          id: s.id,
          shipperName: s.shipperName,
          pickup: s.pickupDistrict,
          dropoff: s.dropoffDistrict,
          weight: `${s.weightTons} tons`,
          price: `${s.offeredPriceRwf.toLocaleString()} RWF`,
          status: s.status as ShipmentStatus,
          truckPlate: s.truckPlate,
          companyName: s.companyName,
          createdAt: s.createdAt,
        }),
      )
      setShipments(data)
      setState('success')
    } catch (err) {
      console.error(err)
      setShipments([])
      setError('Could not load shipments from local demo data.')
      setState('error')
    }
  }

  useEffect(() => {
    void loadShipments()
  }, [])

  const filteredShipments =
    filter === 'ALL'
      ? shipments
      : shipments.filter((s) => s.status === filter)

  return (
    <div className="max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Shipment Monitoring</h1>
          <p className="text-stone-600 mt-1">
            Monitor all shipments on the platform with their current status and partners.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filter}
            onChange={(e) => {
              const next = e.target.value as ShipmentStatus | 'ALL'
              setFilter(next)
              void loadShipments(next)
            }}
            className="text-sm rounded-xl border border-stone-300 bg-white px-3 py-2 text-stone-800 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          >
            {STATUS_FILTER_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option === 'ALL' ? 'All statuses' : STATUS_LABELS[option]}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => void loadShipments(filter)}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-600 hover:text-stone-900 hover:underline"
          >
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
            Refresh
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3 text-xs text-stone-600">
        <span className="inline-flex items-center gap-2 rounded-full bg-cream px-3 py-1 border border-stone-200">
          <span className="inline-block h-2 w-2 rounded-full bg-accent" />
          <span className="font-semibold text-stone-800">
            {filteredShipments.length}
          </span>
          <span className="text-stone-600">
            shipment{filteredShipments.length === 1 ? '' : 's'} in this view
          </span>
        </span>
        <span className="hidden sm:inline text-stone-500">
          Filter by status to focus on specific parts of the lifecycle.
        </span>
      </div>

      {state === 'loading' && (
        <p className="text-stone-500 text-sm mb-4">Loading shipments…</p>
      )}

      {state === 'error' && error && (
        <p className="text-red-600 text-sm mb-4">{error}</p>
      )}

      {state === 'success' && error && (
        <p className="text-amber-600 text-xs mb-3">{error}</p>
      )}

      {state === 'success' && filteredShipments.length === 0 && (
        <div className="bg-white border border-stone-200 rounded-2xl p-8 text-center">
          <p className="text-stone-600">
            No shipments found for this status.
          </p>
        </div>
      )}

      {filteredShipments.length > 0 && (
        <div className="bg-white border border-stone-200 rounded-2xl overflow-x-auto shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="px-4 py-3 font-semibold text-stone-700">ID</th>
                <th className="px-4 py-3 font-semibold text-stone-700">Shipper</th>
                <th className="px-4 py-3 font-semibold text-stone-700">Pickup</th>
                <th className="px-4 py-3 font-semibold text-stone-700">Dropoff</th>
                <th className="px-4 py-3 font-semibold text-stone-700">Weight</th>
                <th className="px-4 py-3 font-semibold text-stone-700">Price</th>
                <th className="px-4 py-3 font-semibold text-stone-700">Status</th>
                <th className="px-4 py-3 font-semibold text-stone-700">Truck</th>
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
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_CLASSES[s.status]}`}
                    >
                      {STATUS_LABELS[s.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-stone-700">{s.truckPlate ?? '—'}</td>
                  <td className="px-4 py-3 text-stone-700">{s.companyName ?? '—'}</td>
                  <td className="px-4 py-3 text-stone-500 text-xs">
                    {new Date(s.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}