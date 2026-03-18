import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

type Shipment = {
  id: number
  pickup_district: string
  dropoff_district: string
  cargo_description: string
  offered_price: number
  status: string
}

export default function Payments() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [shipment, setShipment] = useState<Shipment | null>(null)
  const [provider, setProvider] = useState<'MTN' | 'AIRTEL'>('MTN')
  const [phone, setPhone] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [paying, setPaying] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('loadlink_shipper')
    fetch(`/api/shipments/${id}`, {
      headers: { Authorization: `Bearer ${token ? JSON.parse(token).token : ''}` },
    })
      .then((r) => r.json())
      .then(setShipment)
      .catch(() => null)
  }, [id])

  async function handlePay(e: React.FormEvent) {
    e.preventDefault()
    if (!phone.trim()) { setPhoneError('Phone number is required'); return }
    setPaying(true)
    try {
      const token = localStorage.getItem('loadlink_shipper')
      const res = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token ? JSON.parse(token).token : ''}`,
        },
        body: JSON.stringify({ shipment_id: id, provider, phone }),
      })
      const data = await res.json()
      setPaymentStatus(data.status ?? 'PENDING')
    } catch {
      alert('Payment initiation failed. Please try again.')
    } finally {
      setPaying(false)
    }
  }

  if (!shipment) return <p className="text-stone-500">Loading...</p>

  return (
    <div className="max-w-lg">
      <button type="button" onClick={() => navigate('/loads')} className="text-sm text-stone-500 hover:text-stone-700 mb-4 flex items-center gap-1">
        ← Back to My Shipments
      </button>
      <h1 className="text-2xl font-bold text-stone-800 mb-6">Payment</h1>

      {/* Shipment summary */}
      <div className="bg-white rounded-xl border border-stone-200 p-5 mb-5 space-y-2">
        <h2 className="font-semibold text-stone-700 text-sm uppercase tracking-wide mb-3">Shipment Summary</h2>
        <div className="flex justify-between text-sm">
          <span className="text-stone-500">Route</span>
          <span className="font-medium text-stone-800">{shipment.pickup_district} → {shipment.dropoff_district}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-stone-500">Cargo</span>
          <span className="font-medium text-stone-800">{shipment.cargo_description}</span>
        </div>
        <div className="flex justify-between text-sm border-t border-stone-100 pt-2 mt-2">
          <span className="text-stone-700 font-semibold">Amount</span>
          <span className="font-bold text-stone-800">{Number(shipment.offered_price).toLocaleString()} RWF</span>
        </div>
      </div>

      {paymentStatus === 'ESCROW_FUNDED' ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
          <p className="text-green-700 font-semibold text-lg">Payment confirmed — waiting for pickup</p>
        </div>
      ) : paymentStatus ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 text-center space-y-2">
          <p className="text-yellow-700 font-semibold">Payment status: {paymentStatus}</p>
          <p className="text-yellow-600 text-sm">Please complete the payment prompt on your phone.</p>
        </div>
      ) : (
        <form onSubmit={handlePay} className="bg-white rounded-xl border border-stone-200 p-5 space-y-5">
          <div>
            <p className="text-sm font-semibold text-stone-700 mb-3">Mobile Money Provider</p>
            <div className="flex gap-4">
              {(['MTN', 'AIRTEL'] as const).map((p) => (
                <label key={p} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 cursor-pointer transition-all ${provider === p ? 'border-accent bg-accent/5' : 'border-stone-200 hover:border-stone-300'}`}>
                  <input type="radio" name="provider" value={p} checked={provider === p} onChange={() => setProvider(p)} className="sr-only" />
                  <span className="font-semibold text-stone-800">{p} MoMo</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">Phone Number</label>
            <input
              type="tel"
              placeholder="+250 788 123 456"
              value={phone}
              onChange={(e) => { setPhone(e.target.value); setPhoneError('') }}
              className={`w-full px-4 py-3 rounded-xl bg-stone-50 border ${phoneError ? 'border-red-400' : 'border-stone-200'} text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all`}
            />
            {phoneError && <p className="text-red-500 text-xs mt-1">{phoneError}</p>}
          </div>

          <button
            type="submit"
            disabled={paying}
            className="w-full py-3 bg-accent text-white font-semibold rounded-xl hover:bg-accent-hover transition-all shadow-lg shadow-accent/25 disabled:opacity-60"
          >
            {paying ? 'Processing...' : 'Pay Now'}
          </button>
        </form>
      )}
    </div>
  )
}
