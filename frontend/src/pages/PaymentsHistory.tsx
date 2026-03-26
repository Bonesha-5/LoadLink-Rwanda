import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ensureSeedLoads, getAllLoads, getStageMap } from '../data/storage'

const LOCAL_PAYMENTS_KEY = 'll_shipper_payments'

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

const STATUS_STYLES = {
  CONFIRMED: 'bg-emerald-100 text-emerald-700',
}

function getLocalPayments(): LocalPayment[] {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_PAYMENTS_KEY) ?? '[]') as LocalPayment[]
  } catch {
    return []
  }
}

export default function PaymentsHistory() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const payments = getLocalPayments()

  // Find any load awaiting escrow payment
  ensureSeedLoads(user?.name || 'Shipper')
  const stageMap = getStageMap()
  const pendingLoad = getAllLoads()
    .filter((l) => l.createdBy === (user?.name || 'Shipper'))
    .find((l) => stageMap[l.id] === 'AWAITING_ESCROW')

  return (
    <div className="space-y-6 ll-animate-in">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Payments</h1>
        <p className="text-sm text-stone-600 mt-1">History of all escrow payments made.</p>
      </div>

      {/* Pending payment banner */}
      {pendingLoad && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-amber-900">You have a pending escrow payment</p>
            <p className="text-xs text-amber-700 mt-0.5">
              {pendingLoad.origin} → {pendingLoad.destination} · {pendingLoad.weight}
            </p>
          </div>
          <Link
            to={`/shipment/${pendingLoad.id}/pay`}
            className="flex-shrink-0 px-4 py-2 bg-accent text-sidebar font-semibold rounded-xl hover:bg-accent-hover transition-colors text-sm"
          >
            Complete Payment
          </Link>
        </div>
      )}

      {payments.length === 0 ? (
        <div className="bg-white rounded-3xl border border-stone-200 p-10 text-center shadow-sm">
          <p className="text-stone-500 mb-4">No payments yet. Complete a payment to see it here.</p>
          <button
            type="button"
            onClick={() => navigate('/loads')}
            className="px-5 py-2.5 bg-accent text-sidebar font-semibold rounded-2xl hover:bg-accent-hover transition-all text-sm"
          >
            Go to My Shipments
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="px-4 py-3 font-semibold text-stone-700">Route</th>
                <th className="px-4 py-3 font-semibold text-stone-700">Amount</th>
                <th className="px-4 py-3 font-semibold text-stone-700">Provider</th>
                <th className="px-4 py-3 font-semibold text-stone-700">Phone</th>
                <th className="px-4 py-3 font-semibold text-stone-700">Date</th>
                <th className="px-4 py-3 font-semibold text-stone-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-b border-stone-100 last:border-0 hover:bg-stone-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-stone-800">
                    {p.origin} → {p.destination}
                  </td>
                  <td className="px-4 py-3 font-bold text-stone-900">{p.amount}</td>
                  <td className="px-4 py-3 text-stone-600">{p.provider} Mobile Money</td>
                  <td className="px-4 py-3 text-stone-600">{p.phone}</td>
                  <td className="px-4 py-3 text-stone-500 text-xs">
                    {new Date(p.paidAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLES[p.status]}`}>
                      {p.status}
                    </span>
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
