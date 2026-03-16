import { useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { getAllLoads } from '../data/storage'

type StatusGroup = 'ESCROW_FUNDED' | 'IN_TRANSIT' | 'AWAITING_CONFIRMATION'

const STATUS_LABELS: Record<StatusGroup, string> = {
  ESCROW_FUNDED: 'Escrow funded',
  IN_TRANSIT: 'In transit',
  AWAITING_CONFIRMATION: 'Awaiting confirmation',
}

const STATUS_DESCRIPTIONS: Record<StatusGroup, string> = {
  ESCROW_FUNDED: 'Shipment is paid and ready for pickup.',
  IN_TRANSIT: 'Shipment is currently on the road.',
  AWAITING_CONFIRMATION: 'Waiting for shipper to confirm delivery.',
}

const STATUS_COLORS: Record<StatusGroup, string> = {
  ESCROW_FUNDED: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  IN_TRANSIT: 'bg-blue-50 text-blue-700 border-blue-100',
  AWAITING_CONFIRMATION: 'bg-amber-50 text-amber-800 border-amber-100',
}

export default function CompanyActiveShipments() {
  const { user } = useAuth()
  const companyName = user?.name ?? ''

  // For now we fake status grouping on top of all loads.
  const grouped = useMemo(() => {
    const all = getAllLoads()

    const buckets: Record<StatusGroup, typeof all> = {
      ESCROW_FUNDED: [],
      IN_TRANSIT: [],
      AWAITING_CONFIRMATION: [],
    }

    all.forEach((load, index) => {
      const key: StatusGroup = (['ESCROW_FUNDED', 'IN_TRANSIT', 'AWAITING_CONFIRMATION'] as const)[
        index % 3
      ]
      buckets[key].push(load)
    })

    return buckets
  }, [])

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-800">Active Shipments</h1>
        <p className="text-stone-600 mt-1">
          Shipments that {companyName || 'your company'} is currently involved in, grouped by status.
        </p>
      </div>

      <div className="space-y-6">
        {(Object.keys(STATUS_LABELS) as StatusGroup[]).map((status) => {
          const shipments = grouped[status]
          return (
            <section key={status} className="bg-white rounded-2xl border border-stone-200 p-5">
              <header className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-sm font-semibold text-stone-800 uppercase tracking-wide">
                    {STATUS_LABELS[status]}
                  </h2>
                  <p className="text-xs text-stone-500">
                    {STATUS_DESCRIPTIONS[status]}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${STATUS_COLORS[status]}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {shipments.length} shipment{shipments.length === 1 ? '' : 's'}
                </span>
              </header>

              {shipments.length === 0 ? (
                <p className="text-sm text-stone-500">
                  No shipments in this status yet.
                </p>
              ) : (
                <ul className="space-y-3">
                  {shipments.map((load) => (
                    <li
                      key={load.id}
                      className="rounded-xl border border-stone-200 px-4 py-3 flex items-center justify-between gap-3"
                    >
                      <div>
                        <p className="font-semibold text-stone-800 text-sm">
                          {load.origin} → {load.destination}
                        </p>
                        <p className="text-xs text-stone-500 mt-1">
                          Pickup: {load.date} · Weight: {load.weight}
                        </p>
                      </div>
                      <div className="text-right text-xs text-stone-500">
                        <p>Shipment ID</p>
                        <p className="font-mono text-[11px] text-stone-700 truncate max-w-[140px]">
                          {load.id}
                        </p>
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

