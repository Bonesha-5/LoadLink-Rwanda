import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ensureSeedLoads, getAllLoads, getAllRatings, getStageMap, type Load, type ShipStage } from '../data/storage'

const statusClass: Record<ShipStage, string> = {
  POSTED:                'bg-accent text-sidebar border-accent',
  AWAITING_ESCROW:       'bg-amber-500 text-white border-amber-500',
  ESCROW_FUNDED:         'bg-teal-600 text-white border-teal-600',
  IN_TRANSIT:            'bg-blue-500 text-white border-blue-500',
  AWAITING_CONFIRMATION: 'bg-stone-700 text-white border-stone-700',
  COMPLETED:             'bg-emerald-600 text-white border-emerald-600',
  DISPUTED:              'bg-red-600 text-white border-red-600',
  CANCELLED:             'bg-stone-200 text-stone-500 border-stone-300',
}

const statusLabel: Record<ShipStage, string> = {
  POSTED:                'POSTED',
  AWAITING_ESCROW:       'AWAITING PAYMENT',
  ESCROW_FUNDED:         'ESCROW FUNDED',
  IN_TRANSIT:            'IN TRANSIT',
  AWAITING_CONFIRMATION: 'AWAITING CONFIRMATION',
  COMPLETED:             'COMPLETED',
  DISPUTED:              'DISPUTED',
  CANCELLED:             'CANCELLED',
}

export default function Loads() {
  const { user } = useAuth()
  const [modalLoad, setModalLoad] = useState<{ load: Load; stage: ShipStage } | null>(null)
  const stageMap = getStageMap()

  const myLoads = useMemo(() => {
    ensureSeedLoads(user?.name || 'Shipper')
    return getAllLoads().filter((l) => l.createdBy === (user?.name || 'Shipper'))
  }, [user?.name])

  return (
    <div className="space-y-5 ll-animate-in">
      <Link
        to="/profile"
        className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 text-stone-600 px-4 py-2 text-sm font-semibold hover:bg-stone-50 transition-colors"
      >
        ← Dashboard
      </Link>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-sidebar" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>My Shipments</h1>
          <p className="text-sm text-stone-500 mt-0.5">Track and manage your shipments</p>
        </div>
        <Link
          to="/post-shipment"
          className="inline-flex items-center gap-2 rounded-xl bg-accent text-sidebar px-4 py-2.5 font-bold text-sm hover:bg-accent-hover transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>
          Post New Shipment
        </Link>
      </div>

      <div className="rounded-2xl border border-stone-200 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="bg-cream border-b border-stone-200">
              <th className="px-5 py-3.5 font-semibold text-stone-700 text-sm">Shipment ID</th>
              <th className="px-5 py-3.5 font-semibold text-stone-700 text-sm">Pickup</th>
              <th className="px-5 py-3.5 font-semibold text-stone-700 text-sm">Drop-off</th>
              <th className="px-5 py-3.5 font-semibold text-stone-700 text-sm">Weight (tons)</th>
              <th className="px-5 py-3.5 font-semibold text-stone-700 text-sm">Price (RWF)</th>
              <th className="px-5 py-3.5 font-semibold text-stone-700 text-sm">Status</th>
              <th className="px-5 py-3.5 font-semibold text-stone-700 text-sm">Actions</th>
            </tr>
          </thead>
          <tbody>
            {myLoads.map((l) => {
              const stage: ShipStage = stageMap[l.id] ?? (l.status === 'open' ? 'POSTED' : 'COMPLETED')
              const weightNum = l.weight.replace(/[^0-9.]/g, '')
              const priceNum  = l.price?.replace(/[^0-9,]/g, '') ?? '—'

              return (
                <tr
                  key={l.id}
                  className="odd:bg-white even:bg-cream border-b border-stone-100 last:border-0"
                >
                  <td className="px-5 py-3.5 font-mono text-xs text-stone-500 font-semibold">
                    {l.id}
                  </td>
                  <td className="px-5 py-3.5 text-stone-800">{l.origin}</td>
                  <td className="px-5 py-3.5 text-stone-800">{l.destination}</td>
                  <td className="px-5 py-3.5 text-stone-700">{weightNum}</td>
                  <td className="px-5 py-3.5 text-stone-800">{priceNum}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-bold tracking-wide ${statusClass[stage]}`}>
                      {statusLabel[stage]}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      {/* Eye icon — open modal */}
                      <button
                        type="button"
                        onClick={() => setModalLoad({ load: l, stage })}
                        className="w-8 h-8 rounded-lg border border-stone-200 text-stone-400 flex items-center justify-center hover:border-stone-300 hover:text-stone-600 transition-colors"
                        title="View details"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <ActionButton
                        stage={stage}
                        loadId={l.id}
                        rated={getAllRatings().some((r) => r.shipmentId === l.id)}
                      />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {!myLoads.length && (
          <div className="px-5 py-12 text-center">
            <p className="text-stone-400 mb-3">No shipments yet.</p>
            <Link to="/post-shipment" className="inline-flex items-center gap-1.5 text-sm font-bold text-accent hover:underline">
              Post your first shipment →
            </Link>
          </div>
        )}
      </div>

      {/* Shipment Details Modal */}
      {modalLoad && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setModalLoad(null)}>
          <div className="bg-white rounded-2xl shadow-2xl p-7 max-w-lg w-full relative" onClick={(e) => e.stopPropagation()}>
            {/* Close button */}
            <button
              type="button"
              onClick={() => setModalLoad(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-red-50 border border-red-400 text-red-600 flex items-center justify-center hover:bg-red-100 hover:text-red-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h2 className="text-lg font-bold text-stone-900 mb-5">Shipment Details</h2>

            <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <div>
                <p className="text-xs text-stone-400 mb-0.5">Shipment ID</p>
                <p className="font-semibold text-stone-900">{modalLoad.load.id}</p>
              </div>
              <div>
                <p className="text-xs text-stone-400 mb-0.5">Status</p>
                <span className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-bold tracking-wide ${statusClass[modalLoad.stage]}`}>
                  {statusLabel[modalLoad.stage]}
                </span>
              </div>
              <div>
                <p className="text-xs text-stone-400 mb-0.5">Pickup District</p>
                <p className="font-semibold text-stone-900">{modalLoad.load.origin}</p>
              </div>
              <div>
                <p className="text-xs text-stone-400 mb-0.5">Drop-off District</p>
                <p className="font-semibold text-stone-900">{modalLoad.load.destination}</p>
              </div>
              {modalLoad.load.pickupAddress && (
                <div>
                  <p className="text-xs text-stone-400 mb-0.5">Pickup Description</p>
                  <p className="font-semibold text-stone-900">{modalLoad.load.pickupAddress}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-stone-400 mb-0.5">Pickup Date</p>
                <p className="font-semibold text-stone-900">{modalLoad.load.date}</p>
              </div>
              <div>
                <p className="text-xs text-stone-400 mb-0.5">Cargo Weight</p>
                <p className="font-semibold text-stone-900">{modalLoad.load.weight}</p>
              </div>
              <div>
                <p className="text-xs text-stone-400 mb-0.5">Offered Price</p>
                <p className="font-semibold text-stone-900">{modalLoad.load.price ?? '—'}</p>
              </div>
            </div>

            {modalLoad.load.description && (
              <div className="mt-4 pt-4 border-t border-stone-100">
                <p className="text-xs text-stone-400 mb-1">Cargo Description</p>
                <p className="text-sm text-stone-800">{modalLoad.load.description}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function ActionButton({ stage, loadId }: { stage: ShipStage; loadId: string; rated?: boolean }) {
  if (stage === 'POSTED')
    return (
      <Link
        to={`/shipment/${loadId}/trucks`}
        className="inline-flex items-center rounded-lg border border-stone-300 text-stone-700 px-3 py-1.5 text-xs font-bold hover:bg-accent hover:text-sidebar hover:border-accent transition-colors"
      >
        View Interests
      </Link>
    )

  if (stage === 'AWAITING_CONFIRMATION')
    return (
      <Link
        to={`/shipment/${loadId}/confirm`}
        className="inline-flex items-center gap-1.5 rounded-lg bg-green-800 text-white px-3 py-1.5 text-xs font-bold hover:bg-green-900 transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
        Confirm Delivery
      </Link>
    )

  return null
}
