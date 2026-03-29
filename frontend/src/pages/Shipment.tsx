import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { apiRequest } from '../api/http'
import type { ApiError } from '../api/http'

type ShipmentDetail = {
  id: number
  pickup_district: string
  dropoff_district: string
  pickup_description?: string
  cargo_description?: string
  weight: number
  offered_price: number
  pickup_date: string
  status: string
  created_at: string
}

export default function Shipment() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()

  const token = user?.token ||
    (() => { try { return JSON.parse(localStorage.getItem('loadlink_shipper') ?? '{}')?.token ?? '' } catch { return '' } })()

  const [shipment, setShipment] = useState<ShipmentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id || !token) { setLoading(false); return }
    async function load() {
      try {
        const shipments = await apiRequest<ShipmentDetail[]>('/api/shipments/my', { token })
        const found = shipments.find(s => String(s.id) === id)
        setShipment(found ?? null)
      } catch (e) {
        setError((e as ApiError).message || 'Could not load shipment.')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-7 h-7 rounded-full border-2 border-sidebar border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!shipment || error) {
    return (
      <div className="bg-white rounded-3xl border border-stone-200 p-8 space-y-4">
        <p className="text-stone-600">{error ?? 'Shipment not found.'}</p>
        <Link to="/loads" className="inline-block text-sm font-semibold text-accent hover:underline">
          Back to My Shipments
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 ll-animate-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-stone-900">Shipment details</h1>
        <Link to="/loads" className="text-sm font-semibold text-stone-600 hover:text-stone-900 hover:underline">
          ← Back to My Shipments
        </Link>
      </div>

      <div className="bg-white rounded-3xl border border-stone-200 p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Info label="Shipment ID" value={`#${shipment.id}`} />
        <Info label="Status" value={shipment.status} />
        <Info label="Pickup" value={shipment.pickup_district} />
        <Info label="Drop-off" value={shipment.dropoff_district} />
        <Info label="Weight" value={`${shipment.weight} kg`} />
        <Info label="Offered price" value={`${Number(shipment.offered_price).toLocaleString()} RWF`} />
        <Info label="Pickup date" value={new Date(shipment.pickup_date).toLocaleDateString()} />
        {shipment.cargo_description && (
          <Info label="Cargo description" value={shipment.cargo_description} />
        )}
        {shipment.pickup_description && (
          <Info label="Pickup description" value={shipment.pickup_description} />
        )}
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
