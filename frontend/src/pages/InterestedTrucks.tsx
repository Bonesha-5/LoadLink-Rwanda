import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

type Truck = {
  id: number
  plate_number: string
  truck_type: string
  declared_capacity: number
  rating_average: number | null
  company_name: string
  contact_person: string
}

function Stars({ rating }: { rating: number | null }) {
  const r = rating ?? 0
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} className={`w-4 h-4 ${i <= Math.round(r) ? 'text-yellow-400' : 'text-stone-300'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="text-xs text-stone-500 ml-1">{rating ? rating.toFixed(1) : 'No rating'}</span>
    </span>
  )
}

export default function InterestedTrucks() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [trucks, setTrucks] = useState<Truck[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmTruck, setConfirmTruck] = useState<Truck | null>(null)
  const [selecting, setSelecting] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('loadlink_shipper')
    fetch(`/api/shipments/${id}/interests`, {
      headers: { Authorization: `Bearer ${token ? JSON.parse(token).token : ''}` },
    })
      .then((r) => r.json())
      .then((data) => setTrucks(data))
      .catch(() => setTrucks([]))
      .finally(() => setLoading(false))
  }, [id])

  async function handleSelect() {
    if (!confirmTruck) return
    setSelecting(true)
    try {
      const token = localStorage.getItem('loadlink_shipper')
      const res = await fetch(`/api/shipments/${id}/select`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token ? JSON.parse(token).token : ''}`,
        },
        body: JSON.stringify({ truck_id: confirmTruck.id }),
      })
      if (!res.ok) throw new Error()
      navigate(`/shipment/${id}/pay`)
    } catch {
      alert('Failed to select truck. Please try again.')
    } finally {
      setSelecting(false)
      setConfirmTruck(null)
    }
  }

  if (loading) return <p className="text-stone-500">Loading trucks...</p>

  return (
    <div className="max-w-3xl">
      <button type="button" onClick={() => navigate('/loads')} className="text-sm text-stone-500 hover:text-stone-700 mb-4 flex items-center gap-1">
        ← Back to My Shipments
      </button>
      <h1 className="text-2xl font-bold text-stone-800 mb-1">Interested Trucks</h1>
      <p className="text-stone-500 mb-6">Sorted by rating — highest first.</p>

      {trucks.length === 0 ? (
        <p className="text-stone-500">No trucks have expressed interest yet.</p>
      ) : (
        <div className="space-y-3">
          {trucks.map((truck) => (
            <div key={truck.id} className="bg-white rounded-xl border border-stone-200 p-5 flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-bold text-stone-800">{truck.plate_number}</p>
                <p className="text-sm text-stone-600">{truck.truck_type} · {truck.declared_capacity} tons</p>
                <p className="text-sm text-stone-600">{truck.company_name} · {truck.contact_person}</p>
                <Stars rating={truck.rating_average} />
              </div>
              <button
                type="button"
                onClick={() => setConfirmTruck(truck)}
                className="px-4 py-2 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-accent-hover transition-colors"
              >
                Select Truck
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Confirm modal */}
      {confirmTruck && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h2 className="text-lg font-bold text-stone-800 mb-2">Confirm Selection</h2>
            <p className="text-stone-600 mb-5">
              Are you sure you want to select <span className="font-semibold">{confirmTruck.plate_number}</span> from {confirmTruck.company_name}?
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleSelect}
                disabled={selecting}
                className="flex-1 py-2.5 bg-accent text-white font-semibold rounded-xl hover:bg-accent-hover transition-all disabled:opacity-60"
              >
                {selecting ? 'Selecting...' : 'Confirm'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmTruck(null)}
                className="flex-1 py-2.5 border border-stone-200 text-stone-700 font-semibold rounded-xl hover:bg-stone-50 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
