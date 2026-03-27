import { Link, useParams } from 'react-router-dom'
import { ensureSeedLoads, getAllLoads } from '../data/storage'

export default function Shipment() {
  const { id } = useParams<{ id: string }>()
  ensureSeedLoads()
  const shipment = getAllLoads().find((l) => l.id === id)

  if (!shipment) {
    return (
      <div className="bg-white rounded-3xl border border-stone-200 p-8 space-y-4">
        <p className="text-stone-600">Shipment not found.</p>
        <Link to="/" className="inline-block text-sm font-semibold text-accent hover:underline">
          Back to home
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 ll-animate-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-stone-900">Shipment details</h1>
        <Link to="/" className="text-sm font-semibold text-stone-600 hover:text-stone-900 hover:underline">
          Back to home
        </Link>
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

      <p className="text-sm text-stone-600">
        To view interested trucks, pay escrow, and confirm delivery, sign in to the{' '}
        <Link to="/login/shipper" className="font-semibold text-accent hover:underline">
          Shipper portal
        </Link>
        .
      </p>
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
