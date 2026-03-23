import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

type PaymentRow = {
  shipment_id: number
  pickup_district: string
  dropoff_district: string
  amount: number
  status: 'PENDING' | 'CONFIRMED' | 'RELEASED' | 'REFUNDED'
  provider_reference: string
  created_at: string
}

const STATUS_STYLES: Record<PaymentRow['status'], string> = {
  PENDING:   'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-indigo-100 text-indigo-700',
  RELEASED:  'bg-green-100 text-green-700',
  REFUNDED:  'bg-red-100 text-red-700',
}

export default function PaymentsHistory() {
  const { getToken } = useAuth()
  const navigate = useNavigate()
  const [payments, setPayments] = useState<PaymentRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/payments/my', {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => r.json())
      .then((data) => setPayments(Array.isArray(data) ? data : []))
      .catch(() => setPayments([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-stone-500">Loading payments...</p>

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-stone-800 mb-6">Payments</h1>

      {payments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-10 text-center">
          <p className="text-stone-500 mb-4">No payments yet.</p>
          <button
            type="button"
            onClick={() => navigate('/loads')}
            className="px-5 py-2.5 bg-accent text-white font-semibold rounded-xl hover:bg-accent-hover transition-all text-sm"
          >
            Go to My Shipments
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map((p) => (
            <div key={p.shipment_id} className="bg-white rounded-xl border border-stone-200 p-5 flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-semibold text-stone-800">
                  {p.pickup_district} → {p.dropoff_district}
                </p>
                <p className="text-sm text-stone-500">
                  {new Date(p.created_at).toLocaleDateString()} · Ref: {p.provider_reference}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <p className="font-bold text-stone-800">{Number(p.amount).toLocaleString()} RWF</p>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLES[p.status]}`}>
                  {p.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
