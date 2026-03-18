import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

type Shipment = {
  id: number
  pickup_district: string
  dropoff_district: string
  cargo_description: string
  offered_price: number
  delivery_timestamp: string
}

function useCountdown(deliveryTimestamp: string | undefined) {
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    if (!deliveryTimestamp) return
    const deadline = new Date(deliveryTimestamp).getTime() + 24 * 60 * 60 * 1000

    function tick() {
      const diff = deadline - Date.now()
      if (diff <= 0) { setTimeLeft('00:00:00'); return }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTimeLeft(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`)
    }

    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [deliveryTimestamp])

  return timeLeft
}

export default function DeliveryConfirmation() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [shipment, setShipment] = useState<Shipment | null>(null)
  const [loading, setLoading] = useState(false)
  const timeLeft = useCountdown(shipment?.delivery_timestamp)

  useEffect(() => {
    const token = localStorage.getItem('loadlink_shipper')
    fetch(`/api/shipments/${id}`, {
      headers: { Authorization: `Bearer ${token ? JSON.parse(token).token : ''}` },
    })
      .then((r) => r.json())
      .then(setShipment)
      .catch(() => null)
  }, [id])

  async function handleAction(action: 'confirm' | 'dispute') {
    setLoading(true)
    try {
      const token = localStorage.getItem('loadlink_shipper')
      const res = await fetch(`/api/shipments/${id}/${action}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token ? JSON.parse(token).token : ''}` },
      })
      if (!res.ok) throw new Error()
      navigate('/loads')
    } catch {
      alert('Action failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!shipment) return <p className="text-stone-500">Loading...</p>

  return (
    <div className="max-w-lg">
      <button type="button" onClick={() => navigate('/loads')} className="text-sm text-stone-500 hover:text-stone-700 mb-4 flex items-center gap-1">
        ← Back to My Shipments
      </button>
      <h1 className="text-2xl font-bold text-stone-800 mb-6">Delivery Confirmation</h1>

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
        <div className="flex justify-between text-sm">
          <span className="text-stone-500">Price</span>
          <span className="font-medium text-stone-800">{Number(shipment.offered_price).toLocaleString()} RWF</span>
        </div>
      </div>

      {/* Countdown */}
      <div className="bg-white rounded-xl border border-stone-200 p-5 mb-5 text-center">
        <p className="text-stone-500 text-sm mb-2">Auto-confirm in</p>
        <p className="text-4xl font-bold text-stone-800 font-mono">{timeLeft || '--:--:--'}</p>
      </div>

      <div className="flex gap-3 mb-4">
        <button
          type="button"
          onClick={() => handleAction('confirm')}
          disabled={loading}
          className="flex-1 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-all disabled:opacity-60"
        >
          Confirm Delivery
        </button>
        <button
          type="button"
          onClick={() => handleAction('dispute')}
          disabled={loading}
          className="flex-1 py-3 border-2 border-red-500 text-red-600 font-semibold rounded-xl hover:bg-red-50 transition-all disabled:opacity-60"
        >
          Report Issue
        </button>
      </div>

      <p className="text-xs text-stone-400 text-center">
        If no action is taken, delivery will be auto-confirmed when the timer reaches zero.
      </p>
    </div>
  )
}
