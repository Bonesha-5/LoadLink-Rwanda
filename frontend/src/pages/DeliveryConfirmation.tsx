import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getAllLoads, setStageForLoad } from '../data/storage'

const SELECTED_TRUCK_KEY = 'll_selected_truck_by_load'

type Selected = {
  loadId: string
  companyName: string
  truckId: string
  plate: string
  type: string
  capacity: string
  rating: number
  phone: string
  email: string
}

type ShipmentInfo = {
  id: string
  pickupLocation: string
  dropoffLocation: string
  cargoDescription: string
  truckPlate: string
  transportCompany: string
  deliveryTimestamp: string
}

function useCountdown(deliveryTimestamp: string) {
  const [timeLeft, setTimeLeft]   = useState('')
  const [elapsed, setElapsed]     = useState(0) // 0–100 %

  useEffect(() => {
    const start    = new Date(deliveryTimestamp).getTime()
    const deadline = start + 24 * 60 * 60 * 1000

    function tick() {
      const now  = Date.now()
      const diff = deadline - now
      const pct  = Math.min(100, ((now - start) / (24 * 60 * 60 * 1000)) * 100)
      setElapsed(pct)

      if (diff <= 0) { setTimeLeft('00:00:00'); return }
      const h = Math.floor(diff / 3_600_000)
      const m = Math.floor((diff % 3_600_000) / 60_000)
      const s = Math.floor((diff % 60_000) / 1_000)
      setTimeLeft(
        `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      )
    }

    tick()
    const iv = setInterval(tick, 1000)
    return () => clearInterval(iv)
  }, [deliveryTimestamp])

  return { timeLeft, elapsed }
}

export default function DeliveryConfirmation() {
  const { id }       = useParams<{ id: string }>()
  const navigate     = useNavigate()
  const { getToken } = useAuth()

  const [info, setInfo]           = useState<ShipmentInfo | null>(null)
  const [loading, setLoading]     = useState(true)
  const [actionBusy, setActionBusy] = useState(false)

  // Try API then fall back to localStorage
  useEffect(() => {
    fetch(`/api/shipments/${id}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => { if (!r.ok) throw new Error(); return r.json() })
      .then((data) => {
        const sel: Selected | null = (() => {
          try { return JSON.parse(localStorage.getItem(SELECTED_TRUCK_KEY) ?? 'null') }
          catch { return null }
        })()
        setInfo({
          id:                String(data.id),
          pickupLocation:    data.pickup_district,
          dropoffLocation:   data.dropoff_district,
          cargoDescription:  data.cargo_description,
          truckPlate:        sel?.plate ?? 'N/A',
          transportCompany:  sel?.companyName ?? 'N/A',
          deliveryTimestamp: data.delivery_timestamp ?? new Date().toISOString(),
        })
      })
      .catch(() => {
        // Demo fallback
        const load = getAllLoads().find((l) => l.id === id)
        const sel: Selected | null = (() => {
          try { return JSON.parse(localStorage.getItem(SELECTED_TRUCK_KEY) ?? 'null') }
          catch { return null }
        })()
        if (load) {
          setInfo({
            id:               load.id,
            pickupLocation:   load.origin,
            dropoffLocation:  load.destination,
            cargoDescription: load.description ?? 'No description',
            truckPlate:       sel?.plate ?? 'RAA 000 A',
            transportCompany: sel?.companyName ?? 'Transport Company',
            deliveryTimestamp: new Date().toISOString(),
          })
        }
      })
      .finally(() => setLoading(false))
  }, [id])

  const { timeLeft, elapsed } = useCountdown(info?.deliveryTimestamp ?? new Date().toISOString())

  async function handleAction(action: 'confirm' | 'dispute') {
    setActionBusy(true)
    try {
      const res = await fetch(`/api/shipments/${id}/${action}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      if (!res.ok) throw new Error()
    } catch {
      if (id) setStageForLoad(id, action === 'confirm' ? 'COMPLETED' : 'DISPUTED')
    } finally {
      setActionBusy(false)
      if (action === 'confirm' && id) {
        navigate(`/shipment/${id}/rate`)
      } else {
        navigate('/loads')
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-7 h-7 rounded-full border-2 border-sidebar border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!info) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-stone-900">Delivery Confirmation</h1>
        <p className="text-stone-500">Shipment not found.</p>
        <button type="button" onClick={() => navigate('/loads')} className="text-sm font-semibold text-accent hover:underline">
          ← Back to My Shipments
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6 ll-animate-in">
      <div>
        <h1
          className="text-3xl font-bold text-sidebar"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          Delivery Confirmation
        </h1>
      </div>

      {/* Info card */}
      <div className="bg-cream rounded-2xl border border-stone-200 p-6 grid grid-cols-2 gap-x-8 gap-y-5">
        <InfoItem label="Pickup Location"    value={info.pickupLocation} />
        <InfoItem label="Dropoff Location"   value={info.dropoffLocation} />
        <InfoItem label="Cargo Description"  value={info.cargoDescription} />
        <InfoItem label="Truck Plate Number" value={info.truckPlate} />
        <div className="col-span-2">
          <InfoItem label="Transport Company" value={info.transportCompany} />
        </div>
      </div>

      {/* Countdown */}
      <div className="px-6 py-8 text-center">
        <p className="text-sm font-semibold text-teal-600 mb-4">Time Remaining for Confirmation</p>
        <p className="text-7xl font-bold text-sidebar tracking-tight" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
          {timeLeft || '--:--:--'}
        </p>
        {/* Progress bar */}
        <div className="mt-6 h-1.5 rounded-full bg-rose-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-rose-300 transition-all duration-1000"
            style={{ width: `${elapsed}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-stone-400">{elapsed.toFixed(1)}% of 24 hours elapsed</p>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => handleAction('confirm')}
          disabled={actionBusy}
          className="flex items-center justify-center gap-2 py-4 bg-green-700 text-white font-bold rounded-xl hover:bg-green-800 transition-all disabled:opacity-60 text-base"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" strokeWidth={2} />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 12l3 3 5-5" />
          </svg>
          Confirm Delivery
        </button>
        <button
          type="button"
          onClick={() => handleAction('dispute')}
          disabled={actionBusy}
          className="flex items-center justify-center gap-2 py-4 border-2 border-red-600 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-all disabled:opacity-60 text-base"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          Report an Issue
        </button>
      </div>

      <p className="text-xs text-stone-400 text-center">
        If no action is taken, delivery will be auto-confirmed when the timer reaches zero.
      </p>
    </div>
  )
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-stone-400 font-medium mb-1">{label}</p>
      <p className="text-sm font-bold text-stone-900">{value}</p>
    </div>
  )
}
