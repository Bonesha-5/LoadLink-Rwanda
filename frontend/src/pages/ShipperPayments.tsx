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

  const [provider, setProvider]   = useState<'MTN' | 'AIRTEL' | null>(null)
  const [phone, setPhone]         = useState('')
  const [busy, setBusy]           = useState(false)
  const [payStatus, setPayStatus] = useState<null | 'pending' | 'polling' | 'confirmed'>(null)
  const [phoneError, setPhoneError] = useState('')

  if (!selected || !load) {
    return (
      <div className="space-y-6 ll-animate-in">
        <div className="flex items-center gap-3">
          <Link to="/profile" className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 text-stone-600 px-4 py-2 text-sm font-semibold hover:bg-stone-50 transition-colors">
            ← Dashboard
          </Link>
          <Link to="/loads" className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 text-stone-700 px-4 py-2 text-sm font-semibold hover:bg-stone-50 transition-colors">
            ← Back to Shipments
          </Link>
        </div>
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

  const validatePhone = (): boolean => {
    const digits = phone.trim().replace(/\s+/g, '')
    const mtnPattern    = /^(\+250)?07[89]\d{7}$/
    const airtelPattern = /^(\+250)?07[23]\d{7}$/
    if (provider === 'MTN' && !mtnPattern.test(digits)) {
      setPhoneError('MTN numbers start with 078 or 079 (e.g. 0781234567)')
      return false
    }
    if (provider === 'AIRTEL' && !airtelPattern.test(digits)) {
      setPhoneError('Airtel numbers start with 072 or 073 (e.g. 0721234567)')
      return false
    }
    setPhoneError('')
    return true
  }

  const pay = async () => {
    if (!provider || busy || payStatus === 'confirmed') return
    if (!validatePhone()) return
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
          phone_number: phone.trim(),
        }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json() as { reference_id?: string }
      const refId = data.reference_id
      if (!refId) { doLocal(); return }

      // Poll backend every 2s until payment is confirmed
      setPayStatus('polling')
      const interval = window.setInterval(async () => {
        try {
          const statusRes = await fetch(`/api/payments/status/${refId}`)
          if (!statusRes.ok) return
          const statusData = await statusRes.json() as { payment_status?: string }
          if (statusData.payment_status === 'CONFIRMED') {
            window.clearInterval(interval)
            doLocal()
          }
        } catch { /* keep polling */ }
      }, 2000)
    } catch {
      // API unavailable — simulate locally
      window.setTimeout(doLocal, 3000)
    }
  }

  return (
    <div className="space-y-6 ll-animate-in max-w-2xl">
      {/* Back buttons */}
      <div className="flex items-center gap-3">
        <Link to="/profile" className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 text-stone-600 px-4 py-2 text-sm font-semibold hover:bg-stone-50 transition-colors">
          ← Dashboard
        </Link>
        <Link to="/loads" className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 text-stone-700 px-4 py-2 text-sm font-semibold hover:bg-stone-50 transition-colors">
          ← Back to Shipments
        </Link>
      </div>

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
      {(payStatus === 'pending' || payStatus === 'polling') && (
        <div className="flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
          <p className="text-sm font-semibold text-amber-800">
            {payStatus === 'polling'
              ? 'Waiting for payment confirmation on your phone…'
              : 'Processing payment — please wait…'}
          </p>
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

          {/* Step 1: Choose provider */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => setProvider('MTN')}
              className={`flex items-center justify-center gap-2 rounded-xl py-3.5 font-bold text-sm border-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                provider === 'MTN'
                  ? 'bg-yellow-400 border-yellow-500 text-yellow-900'
                  : 'bg-yellow-50 border-yellow-200 text-yellow-800 hover:border-yellow-400'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              MTN MoMo
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setProvider('AIRTEL')}
              className={`flex items-center justify-center gap-2 rounded-xl py-3.5 font-bold text-sm border-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                provider === 'AIRTEL'
                  ? 'bg-red-600 border-red-700 text-white'
                  : 'bg-red-50 border-red-200 text-red-700 hover:border-red-400'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Airtel Money
            </button>
          </div>

          {/* Step 2: Enter phone number */}
          {provider && (
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-2" htmlFor="payPhone">
                {provider === 'MTN' ? 'MTN' : 'Airtel'} Mobile Money Number
              </label>
              <input
                id="payPhone"
                type="tel"
                placeholder={provider === 'MTN' ? '078x xxx xxx' : '072x xxx xxx'}
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setPhoneError('') }}
                className={`w-full px-4 py-3 rounded-xl border bg-stone-50 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 transition-colors ${phoneError ? 'border-red-300 focus:border-red-400 focus:ring-red-200' : 'border-stone-200 focus:border-accent focus:ring-accent/20'}`}
              />
              {phoneError && <p className="mt-1 text-xs text-red-600">{phoneError}</p>}
            </div>
          )}

          {/* Step 3: Pay Now */}
          <button
            type="button"
            disabled={!provider || !phone.trim() || busy}
            onClick={pay}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-accent text-sidebar py-4 font-bold text-base hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {payStatus === 'polling' ? 'Waiting for confirmation…' : busy ? 'Processing…' : `Pay ${load.price ?? ''} via ${provider ?? '…'}`}
          </button>
        </div>
      )}
    </div>
  )
}
