import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

type ShipmentInfo = {
  plate_number: string
  company_name: string
  truck_id: number
}

export default function RateTruck() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [info, setInfo] = useState<ShipmentInfo | null>(null)
  const [stars, setStars] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('loadlink_shipper')
    fetch(`/api/shipments/${id}/truck-info`, {
      headers: { Authorization: `Bearer ${token ? JSON.parse(token).token : ''}` },
    })
      .then((r) => r.json())
      .then(setInfo)
      .catch(() => null)
  }, [id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stars) { setError('Please select a star rating'); return }
    setSubmitting(true)
    try {
      const token = localStorage.getItem('loadlink_shipper')
      const res = await fetch('/api/ratings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token ? JSON.parse(token).token : ''}`,
        },
        body: JSON.stringify({ shipment_id: id, truck_id: info?.truck_id, stars, comment }),
      })
      if (!res.ok) throw new Error()
      navigate('/loads')
    } catch {
      alert('Failed to submit rating. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!info) return <p className="text-stone-500">Loading...</p>

  return (
    <div className="max-w-md">
      <button type="button" onClick={() => navigate('/loads')} className="text-sm text-stone-500 hover:text-stone-700 mb-4 flex items-center gap-1">
        ← Back to My Shipments
      </button>
      <h1 className="text-2xl font-bold text-stone-800 mb-1">Rate this Truck</h1>
      <p className="text-stone-500 mb-6">Your feedback helps other shippers make better decisions.</p>

      <div className="bg-white rounded-2xl border border-stone-200 p-6">
        <div className="flex items-center gap-3 mb-6 pb-5 border-b border-stone-100">
          <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="1" y="3" width="15" height="13" />
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
              <circle cx="5.5" cy="18.5" r="2.5" />
              <circle cx="18.5" cy="18.5" r="2.5" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-stone-800">{info.plate_number}</p>
            <p className="text-sm text-stone-500">{info.company_name}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <p className="text-sm font-semibold text-stone-700 mb-3">Rating</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => { setStars(i); setError('') }}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(0)}
                  className="focus:outline-none"
                >
                  <svg className={`w-9 h-9 transition-colors ${i <= (hovered || stars) ? 'text-yellow-400' : 'text-stone-300'}`} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
              ))}
            </div>
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">Comment (optional)</label>
            <textarea
              rows={3}
              placeholder="Share your experience with this truck and company..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-accent text-white font-semibold rounded-xl hover:bg-accent-hover transition-all shadow-lg shadow-accent/25 disabled:opacity-60"
          >
            {submitting ? 'Submitting...' : 'Submit Rating'}
          </button>
        </form>
      </div>
    </div>
  )
}
