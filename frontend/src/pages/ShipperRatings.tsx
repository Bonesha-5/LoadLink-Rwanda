import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { apiRequest } from '../api/http'
import type { ApiError } from '../api/http'

type Shipment = {
  id: number
  pickup_district: string
  dropoff_district: string
  status: string
}

export default function ShipperRatings() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const token = user?.token ||
    (() => { try { return JSON.parse(localStorage.getItem('loadlink_shipper') ?? '{}')?.token ?? '' } catch { return '' } })()

  const [shipment, setShipment] = useState<Shipment | null>(null)
  const [loading, setLoading] = useState(true)
  const [stars, setStars] = useState(5)
  const [hover, setHover] = useState<number | null>(null)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const shipments = await apiRequest<Shipment[]>('/api/shipments/my', { token })
        const found = shipments.find(s => String(s.id) === id)
        setShipment(found ?? null)
      } catch (e) {
        setError((e as ApiError).message || 'Could not load shipment.')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [id])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await apiRequest('/api/ratings', {
        method: 'POST',
        token,
        body: {
          shipment_id: id,
          stars,
          comment: comment.trim() || undefined,
        },
      })
      setDone(true)
      setTimeout(() => navigate('/loads'), 2000)
    } catch (e) {
      setError((e as ApiError).message || 'Could not submit rating.')
    } finally {
      setSubmitting(false)
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
        <h1 className="text-2xl font-bold text-stone-900">Rate Shipment</h1>
        <p className="text-stone-500">Shipment not found.</p>
        <button type="button" onClick={() => navigate('/loads')} className="text-sm font-semibold text-accent hover:underline">
          ← Back to My Shipments
        </button>
      </div>
    )
  }

  if (done) {
    return (
      <div className="space-y-4 ll-animate-in">
        <h1 className="text-2xl font-bold text-stone-900">Rate Shipment</h1>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
          <p className="text-sm font-semibold text-emerald-800">Rating submitted — thank you!</p>
          <p className="text-xs text-emerald-700 mt-1">Redirecting to your shipments…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg space-y-6 ll-animate-in">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Rate Shipment</h1>
        <p className="text-sm text-stone-500 mt-1">
          {shipment.pickup_district} → {shipment.dropoff_district}
        </p>
      </div>

      {shipment.status !== 'COMPLETED' && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm text-amber-800">This shipment must be completed before rating.</p>
        </div>
      )}

      <form onSubmit={submit} className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-5">
        <div>
          <p className="text-sm font-semibold text-stone-700 mb-3">Your rating</p>
          <div className="flex gap-2 items-center">
            {[1, 2, 3, 4, 5].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setStars(v)}
                onMouseEnter={() => setHover(v)}
                onMouseLeave={() => setHover(null)}
                className={[
                  'w-11 h-11 rounded-2xl border text-lg transition-all',
                  (hover ?? stars) >= v
                    ? 'bg-amber-400 border-amber-400 text-white scale-110'
                    : 'bg-white border-stone-200 text-stone-300 hover:border-amber-300',
                ].join(' ')}
              >
                ★
              </button>
            ))}
            <span className="ml-2 text-sm text-stone-500">{hover ?? stars} / 5</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-2" htmlFor="comment">
            Comment <span className="font-normal text-stone-400">(optional)</span>
          </label>
          <textarea
            id="comment"
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="How was the delivery experience?"
            className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 min-h-24 resize-none"
          />
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || shipment.status !== 'COMPLETED'}
          className="w-full py-3 rounded-2xl bg-accent text-sidebar font-semibold hover:bg-accent-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? 'Submitting…' : 'Submit Rating'}
        </button>
      </form>
    </div>
  )
}
