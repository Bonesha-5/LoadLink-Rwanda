import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ensureSeedLoads, getAllLoads, getAllRatings, getStageMap, type Load, type ShipStage } from '../data/storage'

const statusClass: Record<ShipStage, string> = {
  POSTED:                'bg-accent text-sidebar border-accent',
  AWAITING_ESCROW:       'bg-teal-600 text-white border-teal-600',
  IN_TRANSIT:            'bg-blue-500 text-white border-blue-500',
  AWAITING_CONFIRMATION: 'bg-stone-700 text-white border-stone-700',
  COMPLETED:             'bg-emerald-600 text-white border-emerald-600',
  DISPUTED:              'bg-red-600 text-white border-red-600',
  CANCELLED:             'bg-stone-200 text-stone-500 border-stone-300',
}

const statusLabel: Record<ShipStage, string> = {
  POSTED:                'POSTED',
  AWAITING_ESCROW:       'ESCROW FUNDED',
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
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">My Shipments</h1>
          <p className="text-sm text-stone-500 mt-0.5">Track and manage your shipments</p>
        </div>
        <Link
          to="/post-shipment"
          className="inline-flex items-center gap-2 rounded-xl bg-accent text-sidebar px-4 py-2.5 font-bold text-sm hover:bg-accent-hover transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Post New Shipment
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-stone-100">
              <th className="px-5 py-3.5 font-semibold text-stone-600 text-xs uppercase tracking-wide">Shipment ID</th>
              <th className="px-5 py-3.5 font-semibold text-stone-600 text-xs uppercase tracking-wide">Pickup</th>
              <th className="px-5 py-3.5 font-semibold text-stone-600 text-xs uppercase tracking-wide">Drop-off</th>
              <th className="px-5 py-3.5 font-semibold text-stone-600 text-xs uppercase tracking-wide">Weight (tons)</th>
              <th className="px-5 py-3.5 font-semibold text-stone-600 text-xs uppercase tracking-wide">Price (RWF)</th>
              <th className="px-5 py-3.5 font-semibold text-stone-600 text-xs uppercase tracking-wide">Status</th>
              <th className="px-5 py-3.5 font-semibold text-stone-600 text-xs uppercase tracking-wide">Actions</th>
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
                  className="border-b border-stone-100 last:border-0 hover:bg-stone-50 transition-colors"
                >
                  <td className="px-5 py-3.5 font-mono text-xs text-stone-500 font-semibold">
                    {l.id}
                  </td>
                  <td className="px-5 py-3.5 text-stone-800">{l.origin}</td>
                  <td className="px-5 py-3.5 text-stone-800">{l.destination}</td>
                  <td className="px-5 py-3.5 text-stone-700">{weightNum}</td>
                  <td className="px-5 py-3.5 text-stone-800 font-semibold">{priceNum}</td>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-7 max-w-lg w-full relative">
            {/* Close button */}
            <button
              type="button"
              onClick={() => setModalLoad(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-lg border border-stone-200 text-stone-400 flex items-center justify-center hover:bg-stone-50 transition-colors"
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

function ActionButton({ stage, loadId, rated }: { stage: ShipStage; loadId: string; rated: boolean }) {
  if (stage === 'POSTED')
    return (
      <Link
        to={`/shipment/${loadId}/trucks`}
        className="inline-flex items-center rounded-lg border-2 border-sidebar text-sidebar px-3 py-1.5 text-xs font-bold hover:bg-sidebar hover:text-white transition-colors"
      >
        View Interests
      </Link>
    )

  if (stage === 'AWAITING_ESCROW')
    return (
      <Link
        to={`/shipment/${loadId}/pay`}
        className="inline-flex items-center gap-1 rounded-lg bg-amber-500 text-white px-3 py-1.5 text-xs font-bold hover:bg-amber-600 transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Pay Escrow
      </Link>
    )

  if (stage === 'IN_TRANSIT')
    return (
      <span className="inline-flex items-center rounded-lg bg-blue-50 text-blue-600 px-3 py-1.5 text-xs font-bold">
        In Transit
      </span>
    )

  if (stage === 'AWAITING_CONFIRMATION')
    return (
      <div className="flex items-center gap-1.5">
        <Link
          to={`/shipment/${loadId}/confirm`}
          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 text-white px-3 py-1.5 text-xs font-bold hover:bg-emerald-700 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" strokeWidth={2} />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 12l3 3 5-5" />
          </svg>
          Confirm Delivery
        </Link>
        <Link
          to={`/shipment/${loadId}/confirm`}
          className="inline-flex items-center rounded-lg border-2 border-red-500 text-red-600 px-3 py-1.5 text-xs font-bold hover:bg-red-50 transition-colors"
        >
          Report Issue
        </Link>
      </div>
    )

  if (stage === 'COMPLETED')
    return rated ? null : (
      <Link
        to={`/shipment/${loadId}/rate`}
        className="inline-flex items-center gap-1 rounded-lg bg-amber-500 text-white px-3 py-1.5 text-xs font-bold hover:bg-amber-600 transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
        Leave Rating
      </Link>
    )

  if (stage === 'DISPUTED')
    return (
      <span className="inline-flex items-center rounded-lg bg-red-100 text-red-700 px-3 py-1.5 text-xs font-bold">
        Disputed
      </span>
    )

  if (stage === 'CANCELLED')
    return (
      <span className="inline-flex items-center rounded-lg bg-stone-100 text-stone-500 px-3 py-1.5 text-xs font-bold">
        Cancelled
      </span>
    )

  return null
}
