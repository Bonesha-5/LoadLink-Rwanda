import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

type ShipmentStatus =
  | 'POSTED'
  | 'AWAITING_ESCROW'
  | 'ESCROW_FUNDED'
  | 'IN_TRANSIT'
  | 'AWAITING_CONFIRMATION'
  | 'COMPLETED'
  | 'DISPUTED'

type Shipment = {
  id: number
  pickup_district: string
  dropoff_district: string
  pickup_description: string
  weight: number
  offered_price: number
  pickup_date: string
  status: ShipmentStatus
  cargo_description?: string
  has_rating?: boolean
  delivery_timestamp?: string
}

const STATUS_STYLES: Record<ShipmentStatus, string> = {
  POSTED: 'bg-blue-100 text-blue-700',
  AWAITING_ESCROW: 'bg-yellow-100 text-yellow-700',
  ESCROW_FUNDED: 'bg-indigo-100 text-indigo-700',
  IN_TRANSIT: 'bg-orange-100 text-orange-700',
  AWAITING_CONFIRMATION: 'bg-purple-100 text-purple-700',
  COMPLETED: 'bg-green-100 text-green-700',
  DISPUTED: 'bg-red-100 text-red-700',
}

export default function Loads() {
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [expanded, setExpanded] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('loadlink_shipper')
    fetch('/api/shipments/mine', {
      headers: { Authorization: `Bearer ${token ? JSON.parse(token).token : ''}` },
    })
      .then((r) => r.json())
      .then((data) => setShipments(data))
      .catch(() => setShipments([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-stone-500">Loading shipments...</p>

  if (shipments.length === 0)
    return (
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-stone-800 mb-2">My Shipments</h1>
        <p className="text-stone-500 mb-4">You haven't posted any shipments yet.</p>
        <button
          type="button"
          onClick={() => navigate('/post-shipment')}
          className="px-5 py-2.5 bg-accent text-white font-semibold rounded-xl hover:bg-accent-hover transition-all"
        >
          Post your first shipment
        </button>
      </div>
    )

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-stone-800">My Shipments</h1>
        <button
          type="button"
          onClick={() => navigate('/post-shipment')}
          className="px-4 py-2 bg-accent text-white font-semibold rounded-xl hover:bg-accent-hover transition-all text-sm"
        >
          + Post Shipment
        </button>
      </div>

      <div className="space-y-3">
        {shipments.map((s) => (
          <div key={s.id} className="bg-white rounded-xl border border-stone-200 overflow-hidden">
            <button
              type="button"
              onClick={() => setExpanded(expanded === s.id ? null : s.id)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-stone-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div>
                  <p className="font-semibold text-stone-800">
                    {s.pickup_district} → {s.dropoff_district}
                  </p>
                  <p className="text-sm text-stone-500 mt-0.5">
                    {new Date(s.pickup_date).toLocaleDateString()} · {s.weight} tons · {Number(s.offered_price).toLocaleString()} RWF
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLES[s.status]}`}>
                  {s.status.replace(/_/g, ' ')}
                </span>
                <svg className={`w-4 h-4 text-stone-400 transition-transform ${expanded === s.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {expanded === s.id && (
              <div className="px-5 pb-5 border-t border-stone-100 pt-4 space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-stone-500">Pickup description</p>
                    <p className="text-stone-800 font-medium">{s.pickup_description}</p>
                  </div>
                  {s.cargo_description && (
                    <div>
                      <p className="text-stone-500">Cargo</p>
                      <p className="text-stone-800 font-medium">{s.cargo_description}</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {s.status === 'POSTED' && (
                    <button
                      type="button"
                      onClick={() => navigate(`/shipment/${s.id}/trucks`)}
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      View Interested Trucks
                    </button>
                  )}
                  {s.status === 'AWAITING_ESCROW' && (
                    <button
                      type="button"
                      onClick={() => navigate(`/shipment/${s.id}/pay`)}
                      className="px-4 py-2 bg-yellow-500 text-white text-sm font-semibold rounded-lg hover:bg-yellow-600 transition-colors"
                    >
                      Pay Now
                    </button>
                  )}
                  {s.status === 'AWAITING_CONFIRMATION' && (
                    <>
                      <button
                        type="button"
                        onClick={() => navigate(`/shipment/${s.id}/confirm`)}
                        className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Confirm Delivery
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate(`/shipment/${s.id}/confirm`)}
                        className="px-4 py-2 border border-red-500 text-red-600 text-sm font-semibold rounded-lg hover:bg-red-50 transition-colors"
                      >
                        Report Issue
                      </button>
                    </>
                  )}
                  {s.status === 'COMPLETED' && !s.has_rating && (
                    <button
                      type="button"
                      onClick={() => navigate(`/shipment/${s.id}/rate`)}
                      className="px-4 py-2 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-accent-hover transition-colors"
                    >
                      Leave Rating
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
