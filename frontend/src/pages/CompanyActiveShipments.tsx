import { useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getAllLoads } from '../data/storage'

type ShipStage =
  | 'POSTED'
  | 'AWAITING_ESCROW'
  | 'IN_TRANSIT'
  | 'AWAITING_CONFIRMATION'
  | 'COMPLETED'
  | 'DISPUTED'

type StatusGroup = 'ESCROW_FUNDED' | 'IN_TRANSIT' | 'AWAITING_CONFIRMATION'

const STAGES_KEY = 'll_shipper_stages'

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

const STATUS_LABELS: Record<StatusGroup, string> = {
  ESCROW_FUNDED: 'Escrow funded',
  IN_TRANSIT: 'In transit',
  AWAITING_CONFIRMATION: 'Awaiting confirmation',
}

const STATUS_DESCRIPTIONS: Record<StatusGroup, string> = {
  ESCROW_FUNDED: 'Paid and ready for pickup.',
  IN_TRANSIT: 'On the road to destination.',
  AWAITING_CONFIRMATION: 'Awaiting delivery confirmation.',
}

const STATUS_COLORS: Record<StatusGroup, string> = {
  ESCROW_FUNDED: 'bg-cream text-sidebar border-stone-200',
  IN_TRANSIT: 'bg-accent/10 text-accent border-accent/20',
  AWAITING_CONFIRMATION: 'bg-amber-50 text-amber-800 border-amber-100',
}

export default function CompanyActiveShipments() {
  const { user } = useAuth()
  const companyName = user?.name ?? ''
  const [refresh, setRefresh] = useState(0)

  const grouped = useMemo(() => {
    const stageMap = getStageMap()
    const all = getAllLoads()

    const buckets: Record<StatusGroup, typeof all> = {
      ESCROW_FUNDED: [],
      IN_TRANSIT: [],
      AWAITING_CONFIRMATION: [],
    }

    for (const load of all) {
      const hasOfferFromCompany = (load.offers ?? []).some((o) => o.companyName === companyName)
      if (!hasOfferFromCompany) continue

      const stage = stageMap[load.id]
      if (stage === 'AWAITING_ESCROW') buckets.ESCROW_FUNDED.push(load)
      if (stage === 'IN_TRANSIT') buckets.IN_TRANSIT.push(load)
      if (stage === 'AWAITING_CONFIRMATION') buckets.AWAITING_CONFIRMATION.push(load)
    }

    return buckets
  }, [companyName, refresh])

  const counts = {
    ESCROW_FUNDED: grouped.ESCROW_FUNDED.length,
    IN_TRANSIT: grouped.IN_TRANSIT.length,
    AWAITING_CONFIRMATION: grouped.AWAITING_CONFIRMATION.length,
  }
  const totalActive = counts.ESCROW_FUNDED + counts.IN_TRANSIT + counts.AWAITING_CONFIRMATION

  const markPickup = (loadId: string) => {
    setStageForLoad(loadId, 'IN_TRANSIT')
    setRefresh((v) => v + 1)
  }

  const markDelivered = (loadId: string) => {
    setStageForLoad(loadId, 'AWAITING_CONFIRMATION')
    setRefresh((v) => v + 1)
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Active shipments</h1>
          <p className="text-sm text-stone-600 mt-1">Track your deliveries by stage.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-2 rounded-full bg-cream px-3 py-1 border border-stone-200 text-stone-700">
            <span className="inline-block h-2 w-2 rounded-full bg-accent" />
            <span className="font-semibold text-stone-900">{totalActive}</span>
            <span>total</span>
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 border border-stone-200 text-stone-700">
            <span className="inline-block h-2 w-2 rounded-full bg-sidebar" />
            <span className="font-semibold text-stone-900">{counts.ESCROW_FUNDED}</span>
            <span>paid</span>
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 border border-stone-200 text-stone-700">
            <span className="inline-block h-2 w-2 rounded-full bg-accent" />
            <span className="font-semibold text-stone-900">{counts.IN_TRANSIT}</span>
            <span>in transit</span>
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 border border-stone-200 text-stone-700">
            <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
            <span className="font-semibold text-stone-900">{counts.AWAITING_CONFIRMATION}</span>
            <span>awaiting</span>
          </span>
        </div>
      </div>

      <div className="space-y-6">
        {(Object.keys(STATUS_LABELS) as StatusGroup[]).map((status) => {
          const shipments = grouped[status]
          return (
            <section key={status} className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
              <header className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-sm font-semibold text-stone-800">{STATUS_LABELS[status]}</h2>
                  <p className="text-xs text-stone-500">{STATUS_DESCRIPTIONS[status]}</p>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${STATUS_COLORS[status]}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {shipments.length} shipment{shipments.length === 1 ? '' : 's'}
                </span>
              </header>

              {shipments.length === 0 ? (
                <p className="text-sm text-stone-500">No shipments in this status yet.</p>
              ) : (
                <ul className="space-y-3">
                  {shipments.map((load) => (
                    <li
                      key={load.id}
                      className="rounded-2xl border border-stone-200 bg-sand px-4 py-3 flex items-start justify-between gap-4"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-stone-800 text-sm">
                          {load.origin} → {load.destination}
                        </p>
                        <p className="text-xs text-stone-500 mt-1">
                          {new Date(load.date).toLocaleDateString()} · {load.weight}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <p className="text-xs font-semibold text-accent">{load.price ?? 'Fixed price'}</p>
                          <p className="text-[11px] text-stone-500">Shipment ID: {load.id}</p>
                        </div>
                      </div>

                      <div className="text-right shrink-0 flex flex-col items-end gap-2">
                        {status === 'ESCROW_FUNDED' ? (
                          <button
                            type="button"
                            onClick={() => markPickup(load.id)}
                            className="inline-flex items-center justify-center px-4 py-2 rounded-2xl bg-accent text-sidebar font-semibold hover:bg-accent-hover transition-colors"
                          >
                            MARK PICKUP
                          </button>
                        ) : null}
                        {status === 'IN_TRANSIT' ? (
                          <button
                            type="button"
                            onClick={() => markDelivered(load.id)}
                            className="inline-flex items-center justify-center px-4 py-2 rounded-2xl bg-sidebar text-white font-semibold hover:bg-sidebar-hover transition-colors"
                          >
                            MARK DELIVERED
                          </button>
                        ) : null}
                        {status === 'AWAITING_CONFIRMATION' ? (
                          <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 text-amber-800 border border-amber-100 px-3 py-1 text-xs font-semibold">
                            Awaiting shipper confirmation
                          </span>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )
        })}
      </div>
    </div>
  )
}

