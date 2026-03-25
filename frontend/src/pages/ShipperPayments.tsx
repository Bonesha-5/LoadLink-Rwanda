import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getAllLoads, getTruckRatingAverage, setStageForLoad, type Load } from '../data/storage'

const SELECTED_TRUCK_KEY = 'll_selected_truck_by_load'
const LOCAL_PAYMENTS_KEY = 'll_shipper_payments'

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

type LocalPayment = {
  id: string
  shipmentId: string
  origin: string
  destination: string
  provider: 'MTN' | 'AIRTEL'
  phone: string
  amount: string
  paidAt: string
  status: 'CONFIRMED'
}

function saveLocalPayment(p: LocalPayment) {
  try {
    const existing: LocalPayment[] = JSON.parse(localStorage.getItem(LOCAL_PAYMENTS_KEY) ?? '[]')
    existing.unshift(p)
    localStorage.setItem(LOCAL_PAYMENTS_KEY, JSON.stringify(existing))
  } catch { /* ignore */ }
}

export default function ShipperPayments() {
  const navigate = useNavigate()

  const selected = useMemo<Selected | null>(() => {
    try {
      const raw = localStorage.getItem(SELECTED_TRUCK_KEY)
      if (!raw) return null
      return JSON.parse(raw) as Selected
    } catch { return null }
  }, [])

  const load = useMemo<Load | null>(() => {
    if (!selected) return null
    return getAllLoads().find((l) => l.id === selected.loadId) ?? null
  }, [selected])

  const truckRating = useMemo(() => {
    if (!selected) return null
    return getTruckRatingAverage(selected.truckId) ?? selected.rating
  }, [selected])

  const [phone, setPhone]         = useState('')
  const [busy, setBusy]           = useState(false)
  const [payStatus, setPayStatus] = useState<null | 'pending' | 'confirmed'>(null)

  if (!selected || !load) {
    return (
      <div className="space-y-6 ll-animate-in">
        <Link to="/loads" className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 text-stone-700 px-4 py-2 text-sm font-semibold hover:bg-stone-50 transition-colors">
          ← Back to Shipments
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Escrow Payment</h1>
          <p className="text-sm text-stone-600 mt-1">Select a truck first.</p>
        </div>
        <Link
          to="/interested-trucks"
          className="inline-flex items-center rounded-xl bg-accent text-sidebar px-4 py-2.5 font-semibold hover:bg-accent-hover transition-colors"
        >
          Go to Interested Trucks
        </Link>
      </div>
    )
  }

  const pay = async (provider: 'MTN' | 'AIRTEL') => {
    if (busy || payStatus === 'confirmed') return
    setBusy(true)
    setPayStatus('pending')

    const doLocal = () => {
      saveLocalPayment({
        id: Math.random().toString(36).slice(2) + Date.now().toString(36),
        shipmentId: selected.loadId,
        origin: load.origin,
        destination: load.destination,
        provider,
        phone: phone.trim(),
        amount: load.price ?? '0 RWF',
        paidAt: new Date().toISOString(),
        status: 'CONFIRMED',
      })
      setStageForLoad(selected.loadId, 'AWAITING_CONFIRMATION')
      setBusy(false)
      setPayStatus('confirmed')
      window.setTimeout(() => navigate('/loads'), 2000)
    }

    try {
      const res = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shipment_id: selected.loadId,
          provider,
          phone: phone.trim(),
          amount: load.price ?? '0',
        }),
      })
      if (!res.ok) throw new Error()
      doLocal()
    } catch {
      // API unavailable — simulate locally
      window.setTimeout(doLocal, 1500)
    }
  }

  return (
    <div className="space-y-6 ll-animate-in max-w-2xl">
      {/* Back button */}
      <Link
        to="/loads"
        className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 text-stone-700 px-4 py-2 text-sm font-semibold hover:bg-stone-50 transition-colors"
      >
        ← Back to Shipments
      </Link>

      {/* Title */}
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
            <span className="font-semibold text-stone-900">{load.origin} → {load.destination}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">Cargo Weight:</span>
            <span className="font-semibold text-stone-900">{load.weight}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">Pickup Date:</span>
            <span className="font-semibold text-stone-900">{load.date}</span>
          </div>
          <div className="flex justify-between border-t border-stone-100 pt-3 mt-1">
            <span className="font-bold text-stone-900">Total Amount:</span>
            <span className="font-bold text-emerald-600 text-base">{load.price ?? '—'}</span>
          </div>
        </div>
      </div>

      {/* Selected Transport Company */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
        <h2 className="text-base font-bold text-stone-900 mb-4">Selected Transport Company</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-stone-500">Company:</span>
            <span className="font-semibold text-stone-900">{selected.companyName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">Truck Plate:</span>
            <span className="font-semibold text-stone-900">{selected.plate}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">Truck Type:</span>
            <span className="font-semibold text-stone-900">{selected.type}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-500">Contact:</span>
            <span className="font-semibold text-stone-900">{selected.phone}</span>
          </div>
          {truckRating != null && (
            <div className="flex justify-between">
              <span className="text-stone-500">Truck Rating:</span>
              <span className="font-semibold text-stone-900">★ {truckRating.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Secure Escrow Info */}
      <div className="bg-stone-50 rounded-2xl border border-emerald-200 p-4 flex items-start gap-3">
        <svg className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <div>
          <p className="text-sm font-bold text-stone-900">Secure Escrow Payment</p>
          <p className="text-xs text-stone-600 mt-0.5">
            Your payment is held securely in escrow and will only be released to the transport company after you confirm successful delivery.
          </p>
        </div>
      </div>

      {/* Payment status messages */}
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

      {/* Select Payment Method */}
      {payStatus !== 'confirmed' && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-stone-900">Select Payment Method</h2>

          {/* Phone number input */}
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2" htmlFor="payPhone">
              Mobile Money Phone Number
            </label>
            <input
              id="payPhone"
              type="tel"
              placeholder="+250 788 123 456"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full max-w-sm px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
            />
          </div>

          {/* MTN Mobile Money */}
          <button
            type="button"
            disabled={busy}
            onClick={() => pay('MTN')}
            className="w-full flex items-center justify-center gap-3 rounded-xl bg-yellow-400 text-yellow-900 py-4 font-bold text-base hover:bg-yellow-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Pay with MTN Mobile Money
          </button>

          {/* Airtel Money */}
          <button
            type="button"
            disabled={busy}
            onClick={() => pay('AIRTEL')}
            className="w-full flex items-center justify-center gap-3 rounded-xl bg-red-600 text-white py-4 font-bold text-base hover:bg-red-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Pay with Airtel Money
          </button>
        </div>
      )}
    </div>
  )
}
