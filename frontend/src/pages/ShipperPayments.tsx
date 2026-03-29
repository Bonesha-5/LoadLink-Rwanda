import { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { apiRequest } from '../api/http'
import type { ApiError } from '../api/http'

const SELECTED_TRUCK_KEY = 'll_selected_truck_by_load'

type SelectedTruck = {
  loadId: string
  truckId: number
  companyName: string
  plate: string
  type: string
  capacity: number
  rating: number
}

type Shipment = {
  id: number
  pickup_district: string
  dropoff_district: string
  weight: number
  offered_price: number
  pickup_date: string
  status: string
}

export default function ShipperPayments() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { getToken } = useAuth()

  const [shipment, setShipment] = useState<Shipment | null>(null)
  const [selected, setSelected] = useState<SelectedTruck | null>(null)
  const [loading, setLoading] = useState(true)
  const [phone, setPhone] = useState('')
  const [busy, setBusy] = useState(false)
  const [payStatus, setPayStatus] = useState<null | 'pending' | 'confirmed' | 'failed'>(null)
  const [referenceId, setReferenceId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Load shipment details and selected truck from localStorage
  useEffect(() => {
    async function load() {
      try {
        const shipments = await apiRequest<Shipment[]>('/api/shipments/my', {
          token: getToken(),
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

    // Get selected truck from localStorage (set by ShipperInterestedTrucks)
    try {
      const raw = localStorage.getItem(SELECTED_TRUCK_KEY)
      if (raw) setSelected(JSON.parse(raw))
    } catch { /* ignore */ }
  }, [id])

  // Poll payment status every 2s after initiating
  useEffect(() => {
    if (!referenceId || payStatus !== 'pending') return
    const interval = setInterval(async () => {
      try {
        const res = await apiRequest<{
          payment_status: string
          shipment_status: string
          shipment_id: number
        }>(`/api/payments/status/${referenceId}`, { token: getToken() })

        if (res.payment_status === 'CONFIRMED') {
          clearInterval(interval)
          setPayStatus('confirmed')
          setBusy(false)
          setTimeout(() => navigate('/loads'), 2000)
        } else if (res.payment_status === 'FAILED') {
          clearInterval(interval)
          setPayStatus('failed')
          setBusy(false)
          setError('Payment failed. Please try again.')
        }
      } catch { /* keep polling */ }
    }, 2000)
    return () => clearInterval(interval)
  }, [referenceId, payStatus])

  const pay = async (provider: 'MTN' | 'AIRTEL') => {
    if (!phone.trim()) { setError('Enter your mobile money phone number.'); return }
    if (!shipment) return
    setBusy(true)
    setError(null)
    setPayStatus('pending')
    try {
      const res = await apiRequest<{ reference_id: string; status: string }>('/api/payments/initiate', {
        method: 'POST',
        token: getToken(),
        body: {
          shipment_id: shipment.id,
          provider,
          phone_number: phone.trim(),
        },
      })
      setReferenceId(res.reference_id)
    } catch (e) {
      setBusy(false)
      setPayStatus(null)
      setError((e as ApiError).message || 'Could not initiate payment.')
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
        <Link to="/loads" className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 text-stone-700 px-4 py-2 text-sm font-semibold hover:bg-stone-50">
          ← Back to Shipments
        </Link>
        <p className="text-stone-500">Shipment not found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 ll-animate-in max-w-2xl">
      <Link to="/loads" className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 text-stone-700 px-4 py-2 text-sm font-semibold hover:bg-stone-50 transition-colors">
        ← Back to Shipments
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-stone-900">Escrow Payment</h1>
        <p className="text-sm text-stone-500 mt-1">Secure payment held until delivery confirmation</p>
      </div>

      {/* Shipment Summary */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
        <h2 className="text-base font-bold text-stone-900 mb-4">Shipment Summary</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-stone-500">Route:</span>
            <span className="font-semibold text-stone-900">{shipment.pickup_district} → {shipment.dropoff_district}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">Weight:</span>
            <span className="font-semibold text-stone-900">{shipment.weight} kg</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">Pickup Date:</span>
            <span className="font-semibold text-stone-900">{new Date(shipment.pickup_date).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between border-t border-stone-100 pt-3 mt-1">
            <span className="font-bold text-stone-900">Total Amount:</span>
            <span className="font-bold text-emerald-600 text-base">{Number(shipment.offered_price).toLocaleString()} RWF</span>
          </div>
        </div>
      </div>

      {/* Selected Truck */}
      {selected && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
          <h2 className="text-base font-bold text-stone-900 mb-4">Selected Transport Company</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-stone-500">Company:</span>
              <span className="font-semibold text-stone-900">{selected.companyName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Plate:</span>
              <span className="font-semibold text-stone-900">{selected.plate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Type:</span>
              <span className="font-semibold text-stone-900">{selected.type}</span>
            </div>
          </div>
        </div>
      )}

      {/* Escrow info */}
      <div className="bg-stone-50 rounded-2xl border border-emerald-200 p-4 flex items-start gap-3">
        <svg className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <div>
          <p className="text-sm font-bold text-stone-900">Secure Escrow Payment</p>
          <p className="text-xs text-stone-600 mt-0.5">
            Your payment is held securely and released to the company only after you confirm delivery.
          </p>
        </div>
      </div>

      {/* Status messages */}
      {payStatus === 'pending' && (
        <div className="flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
          <p className="text-sm font-semibold text-amber-800">Processing payment — please wait…</p>
        </div>
      )}
      {payStatus === 'confirmed' && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <svg className="w-4 h-4 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-emerald-800">Payment confirmed — escrow funded</p>
            <p className="text-xs text-emerald-700 mt-0.5">Redirecting to shipments…</p>
          </div>
        </div>
      )}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Payment form */}
      {payStatus !== 'confirmed' && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-stone-900">Select Payment Method</h2>
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2" htmlFor="payPhone">
              Mobile Money Phone Number
            </label>
            <input
              id="payPhone"
              type="tel"
              placeholder="+250 788 123 456"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full max-w-sm px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
            />
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() => pay('MTN')}
            className="w-full flex items-center justify-center gap-3 rounded-xl bg-yellow-400 text-yellow-900 py-4 font-bold text-base hover:bg-yellow-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Pay with MTN Mobile Money
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => pay('AIRTEL')}
            className="w-full flex items-center justify-center gap-3 rounded-xl bg-red-600 text-white py-4 font-bold text-base hover:bg-red-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Pay with Airtel Money
          </button>
        </div>
      )}
    </div>
  )
}
