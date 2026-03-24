import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { addRating, getTruckRatingAverage, getRatingsByTruck } from '../data/storage'

type ShipStage =
  | 'POSTED'
  | 'AWAITING_ESCROW'
  | 'IN_TRANSIT'
  | 'AWAITING_CONFIRMATION'
  | 'COMPLETED'
  | 'DISPUTED'

const STAGES_KEY = 'll_shipper_stages'
const SELECTED_TRUCK_KEY = 'll_selected_truck_by_load'

function getStageMap(): Record<string, ShipStage> {
  try {
    return JSON.parse(localStorage.getItem(STAGES_KEY) ?? '{}') as Record<string, ShipStage>
  } catch {
    return {}
  }
}

function setStageForLoad(loadId: string, stage: ShipStage) {
  const map = getStageMap()
  map[loadId] = stage
  localStorage.setItem(STAGES_KEY, JSON.stringify(map))
}

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
    } catch {
      return null
    }
  }, [])

  const stage = useMemo(() => {
    if (!selected) return null
    return getStageMap()[selected.loadId] ?? null
  }, [selected])

  const currentAvg = useMemo(() => {
    if (!selected) return null
    return getTruckRatingAverage(selected.truckId)
  }, [selected])

  const ratingsCount = useMemo(() => {
    if (!selected) return 0
    return getRatingsByTruck(selected.truckId).length
  }, [selected])

  const [stars, setStars] = useState<number>(5)
  const [comment, setComment] = useState<string>('')

  if (!selected) {
    return (
      <div className="space-y-6 ll-animate-in">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Rate Truck</h1>
          <p className="text-sm text-stone-600 mt-1">No truck selected yet.</p>
        </div>
        <Link to="/interested-trucks" className="inline-flex items-center rounded-2xl bg-accent text-sidebar px-4 py-2.5 font-semibold hover:bg-accent-hover transition-colors">
          Select a truck
        </Link>
      </div>
    )
  }

  const canSubmit =
    stage === 'IN_TRANSIT' || stage === 'AWAITING_CONFIRMATION' || stage === 'COMPLETED'

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected) return
    if (!canSubmit) return

    addRating({
      truckId: selected.truckId,
      shipmentId: selected.loadId,
      shipperName: user?.name ?? 'Shipper',
      stars: (stars as 1 | 2 | 3 | 4 | 5) ?? 5,
      comment: comment.trim() || undefined,
    })

    setStageForLoad(selected.loadId, 'COMPLETED')
    navigate('/loads')
  }

  return (
    <div className="space-y-6 ll-animate-in">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Ratings</h1>
        <p className="text-sm text-stone-600 mt-1">Rate the truck and confirm delivery.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white rounded-3xl border border-stone-200 p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Selected</p>
              <p className="mt-2 text-sm font-semibold text-stone-900">{selected.companyName}</p>
              <p className="text-sm text-stone-600 mt-1">{selected.plate}</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 text-accent border border-accent/20 px-3 py-1 text-xs font-semibold">
              ★ {currentAvg != null ? currentAvg.toFixed(1) : selected.rating} ({ratingsCount})
            </span>
          </div>

          <form onSubmit={submit} className="mt-5 space-y-4">
            <div>
              <p className="text-sm font-semibold text-stone-700 mb-2">Stars</p>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setStars(v)}
                    className={[
                      'h-10 w-10 rounded-2xl border transition-colors',
                      stars >= v ? 'bg-accent text-sidebar border-accent/30' : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50',
                    ].join(' ')}
                    aria-label={`${v} stars`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-2" htmlFor="ratingComment">
                Comment (optional)
              </label>
              <textarea
                id="ratingComment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 min-h-24"
                placeholder="How was the delivery?"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={!canSubmit}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-accent text-sidebar font-semibold hover:bg-accent-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Confirm Delivery & Submit Rating
              </button>
              {!canSubmit ? (
                <p className="text-sm text-stone-600">
                  Select a truck and complete payment first. Current stage: <span className="font-semibold">{stage ?? '—'}</span>
                </p>
              ) : (
                <p className="text-sm text-stone-500">
                  {stage === 'IN_TRANSIT'
                    ? 'Confirm delivery after payment. In production, the carrier marks delivered first.'
                    : 'Confirm delivery and rate this truck.'}
                </p>
              )}
            </div>
          </form>
        </div>

        <div className="lg:col-span-5 bg-white rounded-3xl border border-stone-200 p-6 shadow-sm">
          <p className="text-sm font-semibold text-stone-900">Recent ratings</p>
          <p className="text-xs text-stone-600 mt-1">Frontend-only demo list.</p>
          <div className="mt-4 space-y-3">
            {selected ? (
              getRatingsByTruck(selected.truckId)
                .slice(0, 4)
                .map((r) => (
                  <div key={r.id} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                    <p className="text-xs font-semibold text-stone-700">
                      ★ {r.stars} <span className="text-stone-500 font-semibold">by {r.shipperName}</span>
                    </p>
                    {r.comment ? <p className="mt-2 text-sm text-stone-600">{r.comment}</p> : <p className="mt-2 text-sm text-stone-500">No comment</p>}
                    <p className="mt-2 text-[11px] text-stone-500">{new Date(r.createdAt).toLocaleDateString()}</p>
                  </div>
                ))
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

