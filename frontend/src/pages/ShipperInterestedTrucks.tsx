import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ensureSeedLoads,
  getAllLoads,
  getTruckRatingAverage,
  getTrucksByCompany,
  type Truck,
} from '../data/storage'

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

type Candidate = {
  loadId: string
  shipmentId: string
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
  const navigate = useNavigate()

  const candidates = useMemo<Candidate[]>(() => {
    ensureSeedLoads()
    const loads = getAllLoads()

    const result: Candidate[] = []
    for (const load of loads) {
      // Only consider loads with at least one offer (company expressed interest)
      for (const offer of load.offers ?? []) {
        const companyTrucks: Truck[] = getTrucksByCompany(offer.companyName)
        const loadWeightTons = parseTons(load.weight) ?? null

        for (const truck of companyTrucks) {
          const cap = parseTons(truck.capacity)
          if (loadWeightTons != null && cap != null && cap < loadWeightTons) continue

          const rating = getTruckRatingAverage(truck.id) ?? 4.2

          result.push({
            loadId: load.id,
            shipmentId: load.id,
            companyName: offer.companyName,
            truckId: truck.id,
            plate: truck.plateNumber ?? 'RAA 000 A',
            type: 'Truck',
            capacity: truck.capacity,
            rating,
            phone: '+250 7XX XXX XXX',
            email: `${offer.companyName.toLowerCase().replace(/\s+/g, '.')}@loadlink.rw`,
          })
        }
      }
    }

    return result.sort((a, b) => b.rating - a.rating)
  }, [])

  const onSelectTruck = (item: Candidate) => {
    localStorage.setItem(
      SELECTED_TRUCK_KEY,
      JSON.stringify({
        ...item,
      }),
    )
    setStageForLoad(item.loadId, 'AWAITING_ESCROW')
    navigate(`/shipment/${item.loadId}/pay`)
  }

  return (
    <div className="space-y-6 ll-animate-in">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Interested Trucks</h1>
          <p className="text-sm text-stone-600 mt-1">Sorted by truck rating (highest first).</p>
        </div>
        <Link to="/payments" className="text-sm font-semibold text-stone-700 hover:text-stone-900 hover:underline">
          Go to escrow payment
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {candidates.map((t) => (
          <div key={`${t.loadId}-${t.truckId}`} className="bg-white rounded-3xl border border-stone-200 p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-stone-900">{t.companyName}</p>
                <p className="text-xs text-stone-500 mt-1">Shipment: {t.loadId.slice(0, 8).toUpperCase()}</p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 text-accent border border-accent/20 px-2.5 py-1 text-xs font-semibold">
                ★ {t.rating.toFixed(1)}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <Info label="Truck plate" value={t.plate} />
              <Info label="Truck type" value={t.type} />
              <Info label="Capacity" value={t.capacity} />
              <Info label="Company phone" value={t.phone} />
              <Info label="Company email" value={t.email} />
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={() => onSelectTruck(t)}
                className="w-full rounded-2xl bg-sidebar text-white px-4 py-2.5 font-semibold hover:bg-sidebar-hover transition-colors"
              >
                SELECT THIS TRUCK
              </button>
            </div>
          </div>
        ))}
      </div>

      {!candidates.length ? (
        <div className="bg-white border border-stone-200 rounded-3xl p-8 text-center">
          <p className="text-stone-500">No interested trucks yet. Companies need to express interest first.</p>
        </div>
      ) : null}
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-stone-50 px-3 py-2">
      <p className="text-[11px] font-semibold text-stone-500">{label}</p>
      <p className="text-sm text-stone-900 mt-0.5">{value}</p>
    </div>
  )
}

