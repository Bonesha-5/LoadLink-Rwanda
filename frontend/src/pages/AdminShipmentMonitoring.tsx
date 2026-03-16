import { useEffect, useState } from 'react'

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
  ESCROW_FUNDED: 'bg-emerald-50 text-emerald-700',
  IN_TRANSIT: 'bg-blue-50 text-blue-700',
  AWAITING_CONFIRMATION: 'bg-amber-50 text-amber-800',
  COMPLETED: 'bg-emerald-100 text-emerald-800',
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
    try {
      setState('loading')
      setError(null)
      const statusParam = selectedStatus === 'ALL' ? '' : `?status=${selectedStatus}`
      const res = await fetch(`/api/admin/shipments${statusParam}`)
      if (!res.ok) throw new Error('Failed to load shipments')
      const data: AdminShipment[] = await res.json()
      setShipments(data)
      setState('success')
    } catch (err) {
      console.error(err)
      // Fallback demo data so the UI looks complete even without backend.
      const demo: AdminShipment[] = [
        {
          id: 'SH-001',
          shipperName: 'ACME Manufacturing',
          pickup: 'Kigali',
          dropoff: 'Gisenyi',
          weight: '5 tons',
          price: '150,000 RWF',
          status: 'ESCROW_FUNDED',
          truckPlate: 'RAB 123 A',
          companyName: 'Kigali Freight Ltd',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'SH-002',
          shipperName: 'Green Farms',
          pickup: 'Kigali',
          dropoff: 'Butare',
          weight: '12 tons',
          price: '320,000 RWF',
          status: 'IN_TRANSIT',
          truckPlate: 'RAC 456 B',
          companyName: 'Rwanda Cargo Co',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'SH-003',
          shipperName: 'Tech Supplies',
          pickup: 'Musanze',
          dropoff: 'Kigali',
          weight: '8 tons',
          price: '240,000 RWF',
          status: 'AWAITING_CONFIRMATION',
          truckPlate: 'RAD 789 C',
          companyName: 'Northern Transport',
          createdAt: new Date().toISOString(),
        },
      ]
      setShipments(demo)
      setError('Showing demo shipments because the API is not reachable yet.')
      setState('success')
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
            className="text-sm font-semibold text-stone-600 hover:text-stone-900 hover:underline"
          >
            Refresh
          </button>
        </div>
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