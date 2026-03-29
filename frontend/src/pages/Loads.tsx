import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { apiRequest } from '../api/http'
import type { ApiError } from '../api/http'

type ShipStage =
  | 'POSTED'
  | 'AWAITING_ESCROW'
  | 'ESCROW_FUNDED'
  | 'IN_TRANSIT'
  | 'AWAITING_CONFIRMATION'
  | 'COMPLETED'
  | 'DISPUTED'
  | 'CANCELLED'

type Shipment = {
  id: number
  pickup_district: string
  dropoff_district: string
  pickup_description?: string
  cargo_description?: string
  weight: number
  offered_price: number
  pickup_date: string
  status: ShipStage
  created_at: string
  interest_count?: number
}

const statusClass: Record<ShipStage, string> = {
  POSTED:                'bg-accent text-sidebar border-accent',
  AWAITING_ESCROW:       'bg-amber-100 text-amber-800 border-amber-200',
  ESCROW_FUNDED:         'bg-amber-100 text-amber-800 border-amber-200',
  IN_TRANSIT:            'bg-blue-500 text-white border-blue-500',
  AWAITING_CONFIRMATION: 'bg-stone-500 text-white border-stone-500',
  COMPLETED:             'bg-emerald-600 text-white border-emerald-600',
  DISPUTED:              'bg-red-600 text-white border-red-600',
  CANCELLED:             'bg-stone-200 text-stone-500 border-stone-300',
}

const statusLabel: Record<ShipStage, string> = {
  POSTED:                'POSTED',
  AWAITING_ESCROW:       'AWAITING ESCROW',
  ESCROW_FUNDED:         'ESCROW FUNDED',
  IN_TRANSIT:            'IN TRANSIT',
  AWAITING_CONFIRMATION: 'AWAITING CONFIRMATION',
  COMPLETED:             'COMPLETED',
  DISPUTED:              'DISPUTED',
  CANCELLED:             'CANCELLED',
}

export default function Loads() {
  const { user, getToken } = useAuth()
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalShipment, setModalShipment] = useState<Shipment | null>(null)

  async function fetchShipments() {
    try {
      const data = await apiRequest<Shipment[]>('/api/shipments/my', {
        token: getToken(),
      })
      setShipments(data)
    } catch (e) {
      setError((e as ApiError).message || 'Could not load shipments.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchShipments()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-7 h-7 rounded-full border-2 border-sidebar border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-5 ll-animate-in">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">My Shipments</h1>
          <p className="text-sm text-stone-500 mt-0.5">Track and manage your shipments</p>
        </div>
        <Link
          to="/post-shipment"
          className="inline-flex items-center gap-2 rounded-xl bg-accent text-sidebar px-4 py-2.5 font-bold text-sm hover:bg-accent-hover transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Post New Shipment
        </Link>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-stone-100">
              <th className="px-5 py-3.5 font-semibold text-stone-600 text-xs uppercase tracking-wide">ID</th>
              <th className="px-5 py-3.5 font-semibold text-stone-600 text-xs uppercase tracking-wide">Pickup</th>
              <th className="px-5 py-3.5 font-semibold text-stone-600 text-xs uppercase tracking-wide">Drop-off</th>
              <th className="px-5 py-3.5 font-semibold text-stone-600 text-xs uppercase tracking-wide">Weight (kg)</th>
              <th className="px-5 py-3.5 font-semibold text-stone-600 text-xs uppercase tracking-wide">Price (RWF)</th>
              <th className="px-5 py-3.5 font-semibold text-stone-600 text-xs uppercase tracking-wide">Status</th>
              <th className="px-5 py-3.5 font-semibold text-stone-600 text-xs uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody>
            {shipments.map((s, idx) => (
              <tr key={s.id} className="border-b border-stone-100 last:border-0 hover:bg-stone-50 transition-colors">
                <td className="px-5 py-3.5 font-mono text-xs text-stone-500 font-semibold">
                  #{shipments.length - idx}
                </td>
                <td className="px-5 py-3.5 text-stone-800">{s.pickup_district}</td>
                <td className="px-5 py-3.5 text-stone-800">{s.dropoff_district}</td>
                <td className="px-5 py-3.5 text-stone-700">{s.weight}</td>
                <td className="px-5 py-3.5 text-stone-800 font-semibold">
                  {Number(s.offered_price).toLocaleString()}
                </td>
                <td className="px-5 py-3.5">
                  <span className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-bold tracking-wide ${statusClass[s.status] ?? 'bg-stone-100 text-stone-600 border-stone-200'}`}>
                    {statusLabel[s.status] ?? s.status}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setModalShipment(s)}
                      className="w-8 h-8 rounded-lg border border-stone-200 text-stone-400 flex items-center justify-center hover:border-stone-300 hover:text-stone-600 transition-colors"
                      title="View details"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    <ActionButton stage={s.status} shipmentId={String(s.id)} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!loading && shipments.length === 0 && (
          <div className="px-5 py-12 text-center">
            <p className="text-stone-400 mb-3">No shipments yet.</p>
            <Link to="/post-shipment" className="inline-flex items-center gap-1.5 text-sm font-bold text-accent hover:underline">
              Post your first shipment →
            </Link>
          </div>
        )}
      </div>

      {/* Shipment Details Modal */}
      {modalShipment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setModalShipment(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-7 max-w-lg w-full relative"
            onClick={e => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setModalShipment(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-stone-100 text-stone-600 flex items-center justify-center hover:bg-stone-200 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className="text-lg font-bold text-stone-900 mb-5">Shipment Details</h2>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <div>
                <p className="text-xs text-stone-400 mb-0.5">Shipment ID</p>
                <p className="font-semibold text-stone-900">#{shipments.length - shipments.findIndex(s => s.id === modalShipment.id)}</p>
              </div>
              <div>
                <p className="text-xs text-stone-400 mb-0.5">Status</p>
                <span className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-bold tracking-wide ${statusClass[modalShipment.status] ?? ''}`}>
                  {statusLabel[modalShipment.status] ?? modalShipment.status}
                </span>
              </div>
              <div>
                <p className="text-xs text-stone-400 mb-0.5">Pickup District</p>
                <p className="font-semibold text-stone-900">{modalShipment.pickup_district}</p>
              </div>
              <div>
                <p className="text-xs text-stone-400 mb-0.5">Drop-off District</p>
                <p className="font-semibold text-stone-900">{modalShipment.dropoff_district}</p>
              </div>
              {modalShipment.pickup_description && (
                <div>
                  <p className="text-xs text-stone-400 mb-0.5">Pickup Description</p>
                  <p className="font-semibold text-stone-900">{modalShipment.pickup_description}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-stone-400 mb-0.5">Pickup Date</p>
                <p className="font-semibold text-stone-900">{new Date(modalShipment.pickup_date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs text-stone-400 mb-0.5">Weight</p>
                <p className="font-semibold text-stone-900">{modalShipment.weight} kg</p>
              </div>
              <div>
                <p className="text-xs text-stone-400 mb-0.5">Offered Price</p>
                <p className="font-semibold text-stone-900">{Number(modalShipment.offered_price).toLocaleString()} RWF</p>
              </div>
            </div>
            {modalShipment.cargo_description && (
              <div className="mt-4 pt-4 border-t border-stone-100">
                <p className="text-xs text-stone-400 mb-1">Cargo Description</p>
                <p className="text-sm text-stone-800">{modalShipment.cargo_description}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function ActionButton({ stage, shipmentId }: { stage: ShipStage; shipmentId: string }) {
  if (stage === 'POSTED')
    return (
      <Link
        to={`/shipment/${shipmentId}/trucks`}
        className="inline-flex items-center rounded-lg border-2 border-sidebar text-sidebar px-3 py-1.5 text-xs font-bold hover:bg-sidebar hover:text-white transition-colors"
      >
        View Interests
      </Link>
    )

  if (stage === 'AWAITING_ESCROW')
    return (
      <Link
        to={`/shipment/${shipmentId}/pay`}
        className="inline-flex items-center gap-1 rounded-lg bg-amber-500 text-white px-3 py-1.5 text-xs font-bold hover:bg-amber-600 transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Pay Escrow
      </Link>
    )

  if (stage === 'IN_TRANSIT')
    return (
      <span className="inline-flex items-center rounded-lg bg-blue-50 text-blue-600 px-3 py-1.5 text-xs font-bold">
        In Transit
      </span>
    )

  if (stage === 'AWAITING_CONFIRMATION')
    return (
      <div className="flex items-center gap-1.5">
        <Link
          to={`/shipment/${shipmentId}/confirm`}
          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 text-white px-3 py-1.5 text-xs font-bold hover:bg-emerald-700 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          Confirm Delivery
        </Link>
        <Link
          to={`/shipment/${shipmentId}/confirm`}
          className="inline-flex items-center rounded-lg border-2 border-red-500 text-red-600 px-3 py-1.5 text-xs font-bold hover:bg-red-50 transition-colors"
        >
          Report Issue
        </Link>
      </div>
    )

  if (stage === 'COMPLETED')
    return (
      <Link
        to={`/shipment/${shipmentId}/rate`}
        className="inline-flex items-center gap-1 rounded-lg bg-amber-500 text-white px-3 py-1.5 text-xs font-bold hover:bg-amber-600 transition-colors"
      >
        Leave Rating
      </Link>
    )

  if (stage === 'DISPUTED')
    return (
      <span className="inline-flex items-center rounded-lg bg-red-100 text-red-700 px-3 py-1.5 text-xs font-bold">
        Disputed
      </span>
    )

  if (stage === 'CANCELLED')
    return (
      <span className="inline-flex items-center rounded-lg bg-stone-100 text-stone-500 px-3 py-1.5 text-xs font-bold">
        Cancelled
      </span>
    )

  return null
}
