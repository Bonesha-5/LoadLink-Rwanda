import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

type Shipment = {
  id: number
  pickup_district: string
  dropoff_district: string
  cargo_description: string
  weight: number
  offered_price: number
  pickup_date: string
}

type Truck = { id: number; plate_number: string; truck_type: string }

export default function CompanyShipments() {
  const { getToken } = useAuth()
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [trucks, setTrucks] = useState<Truck[]>([])
  const [loading, setLoading] = useState(true)
  const [offerShipment, setOfferShipment] = useState<Shipment | null>(null)
  const [selectedTruck, setSelectedTruck] = useState<number | ''>('')
  const [submitting, setSubmitting] = useState(false)
  const [successId, setSuccessId] = useState<number | null>(null)

  const headers = { Authorization: `Bearer ${getToken()}` }

  useEffect(() => {
    Promise.all([
      fetch('/api/shipments/posted', { headers }).then((r) => r.json()),
      fetch('/api/company/trucks', { headers }).then((r) => r.json()),
    ])
      .then(([s, t]) => {
        setShipments(Array.isArray(s) ? s : [])
        setTrucks(Array.isArray(t) ? t : [])
      })
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [])

  async function handleExpressInterest(e: React.FormEvent) {
    e.preventDefault()
    if (!offerShipment || !selectedTruck) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/shipments/interests', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ shipment_id: offerShipment.id, truck_id: selectedTruck }),
      })
      if (!res.ok) throw new Error()
      setSuccessId(offerShipment.id)
      setOfferShipment(null)
      setSelectedTruck('')
    } catch {
      alert('Failed to express interest. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <p className="text-stone-500">Loading shipments...</p>

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-800">Available Shipments</h1>
        <p className="text-stone-600 mt-1">Browse loads posted by shippers and express interest with one of your trucks.</p>
      </div>

      {shipments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-10 text-center">
          <p className="text-stone-600">No open shipments at the moment. Check back later.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {shipments.map((s) => (
            <li key={s.id} className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-bold text-stone-800 text-lg">{s.pickup_district} → {s.dropoff_district}</p>
                <p className="text-stone-600 text-sm mt-1">
                  {new Date(s.pickup_date).toLocaleDateString()} · {s.weight} tons · {Number(s.offered_price).toLocaleString()} RWF
                </p>
                {s.cargo_description && <p className="text-stone-500 text-sm mt-1">{s.cargo_description}</p>}
              </div>
              {successId === s.id ? (
                <span className="text-green-600 font-semibold text-sm">Interest expressed ✓</span>
              ) : (
                <button
                  type="button"
                  onClick={() => { setOfferShipment(s); setSelectedTruck('') }}
                  className="px-5 py-2.5 bg-accent text-white font-semibold rounded-xl hover:bg-accent-hover transition-colors shrink-0"
                >
                  Express Interest
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {offerShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50" onClick={() => setOfferShipment(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-stone-800 mb-1">Express Interest</h2>
            <p className="text-stone-600 text-sm mb-4">{offerShipment.pickup_district} → {offerShipment.dropoff_district}</p>
            <form onSubmit={handleExpressInterest} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">Select Truck</label>
                <select
                  value={selectedTruck}
                  onChange={(e) => setSelectedTruck(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 text-stone-800 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                >
                  <option value="">Choose a truck</option>
                  {trucks.map((t) => (
                    <option key={t.id} value={t.id}>{t.plate_number} — {t.truck_type}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={!selectedTruck || submitting} className="px-5 py-2.5 bg-accent text-white font-semibold rounded-xl hover:bg-accent-hover disabled:opacity-60">
                  {submitting ? 'Submitting...' : 'Confirm'}
                </button>
                <button type="button" onClick={() => setOfferShipment(null)} className="px-5 py-2.5 bg-stone-100 text-stone-700 font-semibold rounded-xl hover:bg-stone-200">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
