import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getAllLoads, getTruckRatingAverage, type Load } from '../data/storage'

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

export default function ShipperPayments() {
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

  const [busy, setBusy] = useState<'MTN' | 'AIRTEL' | null>(null)

  const load = useMemo<Load | null>(() => {
    if (!selected) return null
    const all = getAllLoads()
    return all.find((l) => l.id === selected.loadId) ?? null
  }, [selected])

  const truckRating = useMemo(() => {
    if (!selected) return null
    const avg = getTruckRatingAverage(selected.truckId)
    return avg ?? selected.rating
  }, [selected])

  if (!selected || !load) {
    return (
      <div className="space-y-6 ll-animate-in">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Escrow Payment</h1>
          <p className="text-sm text-stone-600 mt-1">Select a truck first.</p>
        </div>
        <Link to="/interested-trucks" className="inline-flex items-center rounded-2xl bg-accent text-sidebar px-4 py-2.5 font-semibold hover:bg-accent-hover transition-colors">
          Go to Interested Trucks
        </Link>
      </div>
    )
  }

  const pay = (provider: 'MTN' | 'AIRTEL') => {
    setBusy(provider)
    window.setTimeout(() => {
      setStageForLoad(selected.loadId, 'IN_TRANSIT')
      localStorage.setItem(
        'll_shipper_payment_last',
        JSON.stringify({
          loadId: selected.loadId,
          provider,
          paidAt: new Date().toISOString(),
          shipperName: user?.name ?? 'Shipper',
        }),
      )
      setBusy(null)
      navigate('/ratings')
    }, 800)
  }

  return (
    <div className="space-y-6 ll-animate-in">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Escrow Payment</h1>
        <p className="text-sm text-stone-600 mt-1">Pay escrow securely to start the delivery workflow.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white rounded-3xl border border-stone-200 p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Shipment summary</p>
              <p className="mt-2 text-sm font-semibold text-stone-900">
                {load.origin} → {load.destination}
              </p>
            </div>
            <span className="inline-flex items-center rounded-full bg-accent/10 text-accent border border-accent/20 px-3 py-1 text-xs font-semibold">
              {load.price ?? 'Fixed price'}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Info label="Shipment ID" value={load.id.slice(0, 12).toUpperCase()} />
            <Info label="Cargo weight" value={load.weight} />
            <Info label="Pickup date" value={new Date(load.date).toLocaleDateString()} />
            <Info label="Cargo details" value={load.description ?? '—'} />
          </div>
        </div>

        <div className="lg:col-span-5 bg-white rounded-3xl border border-stone-200 p-6 shadow-sm">
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Selected truck</p>
          <p className="mt-2 text-sm font-semibold text-stone-900">{selected.companyName}</p>

          <div className="mt-4 space-y-3">
            <Info label="Truck plate" value={selected.plate} />
            <Info label="Truck type" value={selected.type} />
            <Info label="Capacity" value={selected.capacity} />
            <Info label="Truck rating" value={truckRating != null ? `★ ${truckRating.toFixed(1)}` : '—'} />
            <Info label="Company email" value={selected.email} />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={busy === 'MTN'}
          onClick={() => pay('MTN')}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-sidebar text-white font-semibold hover:bg-sidebar-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {busy === 'MTN' ? 'Processing…' : 'Pay with MTN Mobile Money'}
        </button>
        <button
          type="button"
          disabled={busy === 'AIRTEL'}
          onClick={() => pay('AIRTEL')}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-accent text-sidebar font-semibold hover:bg-accent-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {busy === 'AIRTEL' ? 'Processing…' : 'Pay with Airtel Money'}
        </button>
      </div>

      <div>
        <p className="text-xs text-stone-500">
          Demo escrow payment: we update the shipment stage locally (frontend-only) to simulate IN_TRANSIT.
        </p>
      </div>
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

