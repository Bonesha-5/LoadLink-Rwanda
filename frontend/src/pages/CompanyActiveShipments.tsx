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

  const counts = {
    ESCROW_FUNDED: grouped.ESCROW_FUNDED.length,
    IN_TRANSIT: grouped.IN_TRANSIT.length,
    AWAITING_CONFIRMATION: grouped.AWAITING_CONFIRMATION.length,
  }
  const totalActive = counts.ESCROW_FUNDED + counts.IN_TRANSIT + counts.AWAITING_CONFIRMATION

  return (
    <div className="max-w-5xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Active shipments</h1>
          <p className="text-sm text-stone-600 mt-1">
            Track your deliveries by stage.
          </p>
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
                  <h2 className="text-sm font-semibold text-stone-800">
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
                      className="rounded-2xl border border-stone-200 bg-sand px-4 py-3 flex items-center justify-between gap-4"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-stone-800 text-sm">
                          {load.origin} → {load.destination}
                        </p>
                        <p className="text-xs text-stone-500 mt-1">
                          {new Date(load.date).toLocaleDateString()} · {load.weight}
                        </p>
                        <div className="mt-2">
                          <div className="h-1.5 w-full rounded-full bg-stone-200 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-accent"
                              style={{
                                width:
                                  status === 'ESCROW_FUNDED'
                                    ? '25%'
                                    : status === 'IN_TRANSIT'
                                      ? '70%'
                                      : '90%',
                              }}
                            />
                          </div>
                          <p className="mt-1 text-[11px] text-stone-500">
                            {status === 'ESCROW_FUNDED'
                              ? 'Ready for pickup'
                              : status === 'IN_TRANSIT'
                                ? 'En route'
                                : 'Awaiting confirmation'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-semibold text-accent">
                          {load.price ?? 'Fixed price'}
                        </p>
                        <p className="text-[11px] text-stone-500 mt-1">Shipment ID</p>
                        <p className="font-mono text-[11px] text-stone-700 truncate max-w-[160px]">
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

