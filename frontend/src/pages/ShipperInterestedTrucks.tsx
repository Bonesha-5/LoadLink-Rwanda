import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  ensureSeedLoads,
  getAllLoads,
  getTruckRatingAverage,
  getTrucksByCompany,
  type Load,
  type Truck,
} from '../data/storage'

const STAGES_KEY         = 'll_shipper_stages'
const SELECTED_TRUCK_KEY = 'll_selected_truck_by_load'

type ShipStage = 'POSTED' | 'AWAITING_ESCROW' | 'IN_TRANSIT' | 'AWAITING_CONFIRMATION' | 'COMPLETED' | 'DISPUTED'

function getStageMap(): Record<string, ShipStage> {
  try { return JSON.parse(localStorage.getItem(STAGES_KEY) ?? '{}') as Record<string, ShipStage> }
  catch { return {} }
}

function setStageForLoad(loadId: string, stage: ShipStage) {
  const map = getStageMap()
  map[loadId] = stage
  localStorage.setItem(STAGES_KEY, JSON.stringify(map))
}

type Candidate = {
  loadId: string
  origin: string
  destination: string
  weight: string
  price: string
  companyName: string
  truckId: string
  plate: string
  type: string
  capacity: string
  rating: number
  phone: string
  email: string
}

function parseTons(value: string | undefined): number | null {
  if (!value) return null
  const match = value.match(/(\d+(\.\d+)?)/)
  if (!match) return null
  return Number(match[1])
}

export default function ShipperInterestedTrucks() {
  const navigate    = useNavigate()
  const { id }      = useParams<{ id: string }>()
  const { getToken, user } = useAuth()
  const [pending, setPending] = useState<Candidate | null>(null)

  const load = useMemo<Load | undefined>(() => {
    ensureSeedLoads(user?.name || 'Shipper')
    if (!id) return undefined
    return getAllLoads().find((l) => l.id === id)
  }, [id, user?.name])

  const candidates = useMemo<Candidate[]>(() => {
    ensureSeedLoads(user?.name || 'Shipper')
    const loads = getAllLoads()
    const result: Candidate[] = []
    const filteredLoads: Load[] = id ? loads.filter((l) => l.id === id) : loads

    for (const l of filteredLoads) {
      for (const offer of l.offers ?? []) {
        const companyTrucks: Truck[] = getTrucksByCompany(offer.companyName)
        const loadWeightTons = parseTons(l.weight)

        for (const truck of companyTrucks) {
          const cap = parseTons(truck.capacity)
          if (loadWeightTons != null && cap != null && cap < loadWeightTons) continue

          result.push({
            loadId:      l.id,
            origin:      l.origin,
            destination: l.destination,
            weight:      l.weight,
            price:       l.price ?? '—',
            companyName: offer.companyName,
            truckId:     truck.id,
            plate:       truck.plateNumber ?? 'RAA 000 A',
            type:        truck.type ?? 'Truck',
            capacity:    truck.capacity,
            rating:      getTruckRatingAverage(truck.id) ?? 4.9,
            phone:       truck.phone ?? '+250 788 000 000',
            email:       truck.email ?? `${offer.companyName.toLowerCase().replace(/\s+/g, '.')}@loadlink.rw`,
          })
        }
      }
    }

    return result.sort((a, b) => b.rating - a.rating)
  }, [id, user?.name])

  const confirmSelect = async (item: Candidate) => {
    try {
      await fetch(`/api/shipments/${item.loadId}/select`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ truck_id: item.truckId, company_name: item.companyName }),
      })
    } catch {
      // API unavailable — continue with local state
    } finally {
      localStorage.setItem(SELECTED_TRUCK_KEY, JSON.stringify(item))
      setStageForLoad(item.loadId, 'AWAITING_ESCROW')
      setPending(null)
      navigate(`/shipment/${item.loadId}/pay`)
    }
  }

  return (
    <div className="space-y-6 ll-animate-in">
      {/* Back button */}
      <div>
        <Link
          to="/loads"
          className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 text-stone-700 px-5 py-2.5 text-sm font-semibold hover:bg-stone-50 transition-colors"
        >
          ← Back to Shipments
        </Link>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-sidebar">Interested Trucks</h1>
        {load && (
          <p className="text-sm text-stone-600 mt-1">
            Shipment: {load.origin} → {load.destination} ({load.weight})
          </p>
        )}
        {!load && id && (
          <p className="text-sm text-stone-600 mt-1">All trucks across your shipments.</p>
        )}
        <p className="text-sm text-stone-500 mt-0.5">Sorted by truck rating</p>
      </div>

      {candidates.length === 0 && (
        <div className="bg-white border border-stone-200 rounded-2xl p-10 text-center shadow-sm">
          <p className="text-stone-500 mb-2">No interested trucks yet.</p>
          <p className="text-sm text-stone-400">Companies need to express interest in your shipment first.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {candidates.map((t) => (
          <TruckCard
            key={`${t.loadId}-${t.truckId}`}
            candidate={t}
            onSelect={() => setPending(t)}
          />
        ))}
      </div>

      {/* Confirm modal */}
      {pending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full">
            <h2 className="text-lg font-bold text-stone-900">Confirm truck selection</h2>
            <p className="mt-2 text-sm text-stone-600">
              Select <span className="font-semibold">{pending.plate}</span> from{' '}
              <span className="font-semibold">{pending.companyName}</span> for the shipment{' '}
              <span className="font-semibold">{pending.origin} → {pending.destination}</span>?
            </p>
            <p className="mt-2 text-xs text-stone-400">You will be taken to the escrow payment page.</p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => confirmSelect(pending)}
                className="flex-1 rounded-xl bg-sidebar text-white px-4 py-2.5 font-semibold hover:bg-sidebar-hover transition-colors"
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={() => setPending(null)}
                className="flex-1 rounded-xl border border-stone-200 text-stone-700 px-4 py-2.5 font-semibold hover:bg-stone-50 transition-colors"
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

function StarRating({ rating }: { rating: number }) {
  const filled = Math.floor(rating)
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          className={`w-5 h-5 ${i <= filled ? 'text-amber-400' : 'text-stone-200'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="ml-1.5 text-sm font-semibold text-stone-700">{rating.toFixed(1)}</span>
    </div>
  )
}

function TruckCard({ candidate: t, onSelect }: { candidate: Candidate; onSelect: () => void }) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 border-l-[3px] border-l-[#3D2923] p-5 shadow-sm flex flex-col">
      {/* Company name */}
      <h3 className="text-lg font-bold text-stone-900 mb-3">{t.companyName}</h3>

      {/* Truck Rating */}
      <p className="text-xs font-semibold text-amber-600 mb-1.5">Truck Rating</p>
      <StarRating rating={t.rating} />

      {/* Details */}
      <div className="mt-4 space-y-2.5 text-sm border-t border-stone-100 pt-4">
        <div className="flex justify-between">
          <span className="text-stone-500">Truck Plate:</span>
          <span className="font-bold text-stone-900">{t.plate}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-stone-500">Truck Type:</span>
          <span className="font-bold text-stone-900">{t.type}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-stone-500">Capacity:</span>
          <span className="font-bold text-stone-900">{t.capacity}</span>
        </div>
      </div>

      {/* Contact */}
      <div className="mt-4 space-y-2 text-sm text-stone-600">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-stone-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          <span>{t.phone}</span>
        </div>
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-stone-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span className="truncate">{t.email}</span>
        </div>
      </div>

      {/* Select button */}
      <button
        type="button"
        onClick={onSelect}
        className="mt-5 w-full rounded-xl bg-amber-500 text-white py-3.5 font-semibold hover:bg-amber-600 transition-colors text-sm"
      >
        Select This Truck
      </button>
    </div>
  )
}
