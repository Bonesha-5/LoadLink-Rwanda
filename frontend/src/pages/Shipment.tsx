import { Link, useParams } from 'react-router-dom'
import { ensureSeedLoads, getAllLoads } from '../data/storage'

export default function Shipment() {
  const { id } = useParams<{ id: string }>()
  ensureSeedLoads()
  const shipment = getAllLoads().find((l) => l.id === id)

  if (!shipment) {
    return (
      <div className="bg-white rounded-3xl border border-stone-200 p-8">
        <p className="text-stone-600">Shipment not found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 ll-animate-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-stone-900">Shipment details</h1>
        <Link to="/loads" className="text-sm font-semibold text-stone-600 hover:text-stone-900 hover:underline">Back to My Shipments</Link>
      </div>

      <div className="bg-white rounded-3xl border border-stone-200 p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Info label="Shipment ID" value={shipment.id} />
        <Info label="Status" value={shipment.status === 'open' ? 'POSTED' : 'COMPLETED'} />
        <Info label="Pickup" value={shipment.origin} />
        <Info label="Drop-off" value={shipment.destination} />
        <Info label="Weight" value={shipment.weight} />
        <Info label="Offered price" value={shipment.price ?? '—'} />
        <Info label="Pickup date" value={new Date(shipment.date).toLocaleDateString()} />
        <Info label="Description" value={shipment.description ?? '—'} />
      </div>

      <div className="flex flex-wrap gap-3">
        <Link to="/interested-trucks" className="rounded-2xl bg-sidebar text-white px-4 py-2.5 font-semibold hover:bg-sidebar-hover transition-colors">
          View Interested Trucks
        </Link>
        <Link to="/payments" className="rounded-2xl bg-accent text-sidebar px-4 py-2.5 font-semibold hover:bg-accent-hover transition-colors">
          Go to Escrow Payment
        </Link>
      </div>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
      <p className="text-xs font-semibold text-stone-500">{label}</p>
      <p className="mt-1 text-sm text-stone-900 break-all">{value}</p>
    </div>
  )
}
