import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  addRating,
  getAllLoads,
  getAllRatings,
  getStageMap,
  getTrucksByCompany,
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

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      className={`w-10 h-10 ${filled ? 'text-accent' : 'text-stone-200'}`}
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  )
}

export default function ShipperRatings() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()

  const selected = useMemo<Selected | null>(() => {
    try {
      const raw = localStorage.getItem(SELECTED_TRUCK_KEY)
      if (!raw) return null
      return JSON.parse(raw) as Selected
    } catch { return null }
  }, [])

  // Derive truck info from route param if selected truck not in localStorage
  const truckInfo = useMemo(() => {
    if (selected) return { plate: selected.plate, type: selected.type, loadId: selected.loadId, truckId: selected.truckId }
    if (!id) return null
    const load = getAllLoads().find((l) => l.id === id)
    if (!load) return null
    const offer = load.offers?.[0]
    if (!offer) return null
    const trucks = getTrucksByCompany(offer.companyName)
    const truck = trucks[0]
    if (!truck) return null
    return { plate: truck.plateNumber ?? 'RAA 000 A', type: truck.type ?? 'Truck', loadId: id, truckId: truck.id }
  }, [selected, id])

  const stage = useMemo(() => {
    const loadId = truckInfo?.loadId ?? selected?.loadId
    if (!loadId) return null
    return getStageMap()[loadId] ?? null
  }, [truckInfo, selected])

  const alreadyRated = useMemo(() => {
    if (!truckInfo) return false
    // Seed loads always show fresh rating UI in demo mode
    if (['s1', 's2', 's3'].includes(truckInfo.loadId)) return false
    return getAllRatings().some((r) => r.shipmentId === truckInfo.loadId)
  }, [truckInfo])

  const [stars, setStars] = useState(0)
  const [hover, setHover] = useState<number | null>(null)

  const activeStars = hover ?? stars

  const submit = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    if (stars === 0 || alreadyRated || !truckInfo) return

    const ratingData = {
      truckId:     truckInfo.truckId,
      shipmentId:  truckInfo.loadId,
      shipperName: user?.name ?? 'Shipper',
      stars:       stars as 1 | 2 | 3 | 4 | 5,
      comment:     undefined,
    }

    try {
      const res = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          truck_id:    ratingData.truckId,
          shipment_id: ratingData.shipmentId,
          stars:       ratingData.stars,
        }),
      })
      if (!res.ok) throw new Error()
    } catch {
      // API unavailable — save locally
    } finally {
      addRating(ratingData)
      setStageForLoad(truckInfo.loadId, 'COMPLETED')
      navigate('/loads')
    }
  }

  const skip = () => navigate('/loads')

  return (
    <div className="flex justify-center ll-animate-in">
      <div className="w-full max-w-xl">
        {/* Red top accent bar */}
        <div className="h-1 w-full rounded-t-2xl bg-sidebar" />

        <div className="bg-white rounded-b-2xl border border-stone-200 shadow-sm px-10 py-10 space-y-7">
          {/* Title */}
          <h1
            className="text-2xl font-bold text-sidebar text-center"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Rate this Truck
          </h1>

          {/* Truck info card */}
          <div className="bg-cream rounded-xl border border-stone-200 px-6 py-6 text-center space-y-4">
            {truckInfo ? (
              <>
                <div>
                  <p className="text-xs text-stone-400 font-medium mb-1">Truck Plate Number</p>
                  <p className="text-lg font-bold text-stone-900">{truckInfo.plate}</p>
                </div>
                <div>
                  <p className="text-xs text-stone-400 font-medium mb-1">Truck Type</p>
                  <p className="text-lg font-bold text-stone-900">{truckInfo.type}</p>
                </div>
              </>
            ) : (
              <p className="text-sm text-stone-400">No truck information available.</p>
            )}
          </div>

          {alreadyRated ? (
            <div className="text-center space-y-4">
              <p className="text-sm font-semibold text-emerald-700">You already rated this shipment. Thank you!</p>
              <button
                type="button"
                onClick={() => navigate('/loads')}
                className="w-full py-3.5 rounded-xl bg-accent text-sidebar font-bold text-base hover:bg-accent-hover transition-colors"
              >
                Back to My Shipments
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-6">
              {/* Stars */}
              <div className="text-center space-y-3">
                <p className="text-sm text-stone-500">How would you rate your experience with this truck?</p>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setStars(v)}
                      onMouseEnter={() => setHover(v)}
                      onMouseLeave={() => setHover(null)}
                      className="focus:outline-none transition-transform hover:scale-110"
                    >
                      <StarIcon filled={activeStars >= v} />
                    </button>
                  ))}
                </div>
                {activeStars > 0 && (
                  <p className="text-sm font-semibold text-accent">
                    You selected {activeStars} star{activeStars !== 1 ? 's' : ''}
                  </p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={stars === 0}
                className="w-full py-3.5 rounded-xl bg-accent text-sidebar font-bold text-base hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                Submit Rating
              </button>

              {/* Skip */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={skip}
                  className="text-sm text-stone-400 hover:text-stone-600 transition-colors"
                >
                  Skip for now
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
