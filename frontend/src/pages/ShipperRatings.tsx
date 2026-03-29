import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  addRating,
  getTruckRatingAverage,
  getRatingsByTruck,
  getStageMap,
  setStageForLoad,
} from '../data/storage'

const SELECTED_TRUCK_KEY = 'll_selected_truck_by_load'

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

export default function ShipperRatings() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const selected = useMemo<Selected | null>(() => {
    try {
      const raw = localStorage.getItem(SELECTED_TRUCK_KEY)
      if (!raw) return null
      return JSON.parse(raw) as Selected
    } catch { return null }
  }, [])

  const stage = useMemo(() => {
    if (!selected) return null
    return getStageMap()[selected.loadId] ?? null
  }, [selected])

  const alreadyRated = useMemo(() => {
    if (!selected) return false
    return getRatingsByTruck(selected.truckId).some((r) => r.shipmentId === selected.loadId)
  }, [selected])

  const currentAvg   = useMemo(() => selected ? getTruckRatingAverage(selected.truckId) : null, [selected])
  const ratingsCount = useMemo(() => selected ? getRatingsByTruck(selected.truckId).length : 0, [selected])

  const [stars, setStars]     = useState(5)
  const [hover, setHover]     = useState<number | null>(null)
  const [comment, setComment] = useState('')

  if (!selected) {
    return (
      <div className="space-y-6 ll-animate-in">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Rate Truck</h1>
          <p className="text-sm text-stone-600 mt-1">No truck selected yet.</p>
        </div>
        <Link
          to="/interested-trucks"
          className="inline-flex items-center rounded-2xl bg-accent text-sidebar px-4 py-2.5 font-semibold hover:bg-accent-hover transition-colors"
        >
          Select a truck
        </Link>
      </div>
    )
  }

  const canSubmit = stage === 'IN_TRANSIT' || stage === 'AWAITING_CONFIRMATION' || stage === 'COMPLETED'

  const submit = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    if (!canSubmit || alreadyRated) return

    const ratingData = {
      truckId:     selected.truckId,
      shipmentId:  selected.loadId,
      shipperName: user?.name ?? 'Shipper',
      stars:       stars as 1 | 2 | 3 | 4 | 5,
      comment:     comment.trim() || undefined,
    }

    try {
      const res = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          truck_id:    ratingData.truckId,
          shipment_id: ratingData.shipmentId,
          stars:       ratingData.stars,
          comment:     ratingData.comment,
        }),
      })
      if (!res.ok) throw new Error()
    } catch {
      // API unavailable — save locally
    } finally {
      addRating(ratingData)
      setStageForLoad(selected.loadId, 'COMPLETED')
      navigate('/loads')
    }
  }

  const recentRatings = getRatingsByTruck(selected.truckId).slice(0, 4)

  return (
    <div className="space-y-6 ll-animate-in">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Rate Truck</h1>
        <p className="text-sm text-stone-600 mt-1">Rate the truck and confirm delivery.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Rating form */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-stone-200 p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Selected truck</p>
              <p className="mt-2 text-sm font-semibold text-stone-900">{selected.companyName}</p>
              <p className="text-sm text-stone-500 mt-0.5">{selected.plate} · {selected.type}</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 text-accent border border-accent/20 px-3 py-1 text-xs font-semibold">
              ★ {currentAvg != null ? currentAvg.toFixed(1) : selected.rating.toFixed(1)} ({ratingsCount})
            </span>
          </div>

          {alreadyRated ? (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
              <p className="text-sm font-semibold text-emerald-800">You already rated this shipment.</p>
              <p className="text-xs text-emerald-700 mt-1">Thank you for your feedback!</p>
              <button
                type="button"
                onClick={() => navigate('/loads')}
                className="mt-4 inline-flex items-center px-4 py-2 rounded-2xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 transition-colors"
              >
                Back to My Shipments
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-6 space-y-5">
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
                <label className="block text-sm font-semibold text-stone-700 mb-2" htmlFor="ratingComment">
                  Comment <span className="font-normal text-stone-400">(optional)</span>
                </label>
                <textarea
                  id="ratingComment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="How was the delivery experience?"
                  className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 min-h-24 resize-none"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-accent text-sidebar font-semibold hover:bg-accent-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Confirm Delivery &amp; Submit Rating
                </button>
                {!canSubmit && (
                  <p className="text-sm text-stone-500">
                    Complete payment first. Stage: <span className="font-semibold">{stage ?? '—'}</span>
                  </p>
                )}
              </div>
            </form>
          )}
        </div>

        {/* Recent ratings panel */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-stone-200 p-6 shadow-sm">
          <p className="text-sm font-semibold text-stone-900">Recent ratings for this truck</p>
          <p className="text-xs text-stone-500 mt-1 mb-4">
            {ratingsCount === 0 ? 'No ratings yet — be the first!' : `${ratingsCount} rating${ratingsCount !== 1 ? 's' : ''} total`}
          </p>
          {recentRatings.length > 0 ? (
            <div className="space-y-3">
              {recentRatings.map((r) => (
                <div key={r.id} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-stone-600">{r.shipperName}</p>
                    <span className="text-amber-400 text-sm">{'★'.repeat(r.stars)}</span>
                  </div>
                  {r.comment && <p className="mt-2 text-sm text-stone-600">{r.comment}</p>}
                  <p className="mt-2 text-[11px] text-stone-400">{new Date(r.createdAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-stone-200 p-6 text-center">
              <p className="text-sm text-stone-400">No ratings yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
