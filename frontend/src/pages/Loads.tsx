import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ensureSeedLoads, getAllLoads } from '../data/storage'

type ShipStage =
  | 'POSTED'
  | 'AWAITING_ESCROW'
  | 'IN_TRANSIT'
  | 'AWAITING_CONFIRMATION'
  | 'COMPLETED'
  | 'DISPUTED'

const STAGES_KEY = 'll_shipper_stages'

function getStageMap(): Record<string, ShipStage> {
  try {
    return JSON.parse(localStorage.getItem(STAGES_KEY) ?? '{}') as Record<string, ShipStage>
  } catch {
    return {}
  }
}

const statusClass: Record<ShipStage, string> = {
  POSTED: 'bg-accent/10 text-accent border-accent/20',
  AWAITING_ESCROW: 'bg-amber-50 text-amber-800 border-amber-100',
  IN_TRANSIT: 'bg-accent/10 text-accent border-accent/20',
  AWAITING_CONFIRMATION: 'bg-stone-100 text-stone-700 border-stone-200',
  COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  DISPUTED: 'bg-red-50 text-red-700 border-red-100',
}

export default function Loads() {
  const { user } = useAuth()
  const stageMap = getStageMap()
  const myLoads = useMemo(() => {
    ensureSeedLoads()
    return getAllLoads().filter((l) => l.createdBy === (user?.name || 'Shipper'))
  }, [user?.name])

  return (
    <div className="space-y-6 ll-animate-in">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">My Shipments</h1>
          <p className="text-sm text-stone-600 mt-1">Track all posted shipments and open shipment details.</p>
        </div>
        <Link to="/post-shipment" className="inline-flex items-center rounded-2xl bg-accent text-sidebar px-4 py-2.5 font-semibold hover:bg-accent-hover transition-colors">
          Post Shipment
        </Link>
      </div>

      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-stone-50 border-b border-stone-200">
            <tr>
              <th className="px-4 py-3 font-semibold text-stone-700">Shipment ID</th>
              <th className="px-4 py-3 font-semibold text-stone-700">Pickup</th>
              <th className="px-4 py-3 font-semibold text-stone-700">Drop-off</th>
              <th className="px-4 py-3 font-semibold text-stone-700">Weight</th>
              <th className="px-4 py-3 font-semibold text-stone-700">Price</th>
              <th className="px-4 py-3 font-semibold text-stone-700">Status</th>
              <th className="px-4 py-3 font-semibold text-stone-700">Action</th>
            </tr>
          </thead>
          <tbody>
            {myLoads.map((l) => (
              <tr key={l.id} className="border-b border-stone-100 last:border-0">
                <td className="px-4 py-3 text-stone-600 text-xs">{l.id.slice(0, 8).toUpperCase()}</td>
                <td className="px-4 py-3 text-stone-800">{l.origin}</td>
                <td className="px-4 py-3 text-stone-800">{l.destination}</td>
                <td className="px-4 py-3 text-stone-600">{l.weight}</td>
                <td className="px-4 py-3 text-stone-800 font-semibold">{l.price ?? '—'}</td>
                <td className="px-4 py-3">
                  {(() => {
                    const stage: ShipStage = stageMap[l.id] ?? (l.status === 'open' ? 'POSTED' : 'COMPLETED')
                    return (
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass[stage]}`}>
                        {stage}
                      </span>
                    )
                  })()}
                </td>
                <td className="px-4 py-3">
                  <Link to={`/shipment/${l.id}`} className="text-sm font-semibold text-stone-700 hover:text-stone-900 hover:underline">Open</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!myLoads.length ? (
          <p className="px-4 py-8 text-center text-stone-500">No shipments yet. Post one to start the workflow.</p>
        ) : null}
      </div>
    </div>
  )
}
