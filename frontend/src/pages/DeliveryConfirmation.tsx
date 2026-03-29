import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { apiRequest } from '../api/http'
import type { ApiError } from '../api/http'

const SELECTED_TRUCK_KEY = 'll_selected_truck_by_load'

type Selected = {
  loadId: string
  companyName: string
  plate: string
  type: string
}

type Shipment = {
  id: number
  pickup_district: string
  dropoff_district: string
  cargo_description?: string
  status: string
  delivered_at?: string
}

function useCountdown(deliveryTimestamp: string) {
  const [timeLeft, setTimeLeft] = useState('')
  const [elapsed, setElapsed]   = useState(0)

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
  const { getToken, user } = useAuth()

  // Read token directly from localStorage as fallback for when user state hasn't loaded yet
  const token = user?.token ||
    (() => { try { return JSON.parse(localStorage.getItem('loadlink_shipper') ?? '{}')?.token ?? '' } catch { return '' } })()

  const [shipment,    setShipment]    = useState<Shipment | null>(null)
  const [selected,    setSelected]    = useState<Selected | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [actionBusy,  setActionBusy]  = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const shipments = await apiRequest<Shipment[]>('/api/shipments/my', {
          token: token,
        })
        const found = shipments.find(s => String(s.id) === id)
        setShipment(found ?? null)
      } catch (e) {
        setError((e as ApiError).message || 'Could not load shipment.')
      } finally {
        setLoading(false)
      }
    }
    void load()

    try {
      const raw = localStorage.getItem(SELECTED_TRUCK_KEY)
      if (raw) setSelected(JSON.parse(raw))
    } catch { /* ignore */ }
  }, [id])

  const deliveryTs = shipment?.delivered_at ?? new Date().toISOString()
  const { timeLeft, elapsed } = useCountdown(deliveryTs)

  async function handleAction(action: 'confirm' | 'dispute') {
    setActionBusy(true)
    setError(null)
    try {
      await apiRequest(`/api/shipments/${id}/${action}`, {
        method: 'PATCH',
        token: token,
      })
      navigate('/loads')
    } catch (e) {
      setError((e as ApiError).message || `Could not ${action} delivery.`)
      setActionBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-7 h-7 rounded-full border-2 border-sidebar border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!shipment) {
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
      <h1 className="text-2xl font-bold text-sidebar">Delivery Confirmation</h1>

      <div className="bg-cream rounded-2xl border border-stone-200 p-6 grid grid-cols-2 gap-x-8 gap-y-5">
        <InfoItem label="Pickup Location"   value={shipment.pickup_district} />
        <InfoItem label="Dropoff Location"  value={shipment.dropoff_district} />
        <InfoItem label="Cargo Description" value={shipment.cargo_description ?? '—'} />
        <InfoItem label="Truck Plate"       value={selected?.plate ?? '—'} />
        <InfoItem label="Transport Company" value={selected?.companyName ?? '—'} />
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 p-6 text-center">
        <p className="text-sm font-semibold text-blue-600 mb-3">Time Remaining for Confirmation</p>
        <p className="text-6xl font-bold text-sidebar font-mono tracking-tight">
          {timeLeft || '--:--:--'}
        </p>
        <div className="mt-4 h-1.5 rounded-full bg-stone-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-red-300 transition-all duration-1000"
            style={{ width: `${elapsed}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-stone-400">{elapsed.toFixed(1)}% of 24 hours elapsed</p>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => handleAction('confirm')}
          disabled={actionBusy}
          className="flex items-center justify-center gap-2 py-4 bg-emerald-700 text-white font-bold rounded-xl hover:bg-emerald-800 transition-all disabled:opacity-60 text-sm"
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
          className="flex items-center justify-center gap-2 py-4 border-2 border-red-600 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-all disabled:opacity-60 text-sm"
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
