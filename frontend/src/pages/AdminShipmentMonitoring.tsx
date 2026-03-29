import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { apiRequest } from '../api/http'
import type { ApiError } from '../api/http'

type Shipment = {
  id: string
  pickup_district: string
  dropoff_district: string
  weight: string
  offered_price: string
  status: string
  pickup_date: string | null
  created_at: string
  shipper_name: string
  shipper_email: string
  truck_plate: string | null
  company_name: string | null
}

const STATUS_OPTIONS = [
  'ALL', 'POSTED', 'AWAITING_ESCROW', 'ESCROW_FUNDED',
  'IN_TRANSIT', 'AWAITING_CONFIRMATION', 'COMPLETED', 'DISPUTED', 'CANCELLED'
]

const STATUS_COLORS: Record<string, string> = {
  POSTED:                'bg-accent/10 text-accent',
  AWAITING_ESCROW:       'bg-amber-100 text-amber-700',
  ESCROW_FUNDED:         'bg-amber-100 text-amber-700',
  IN_TRANSIT:            'bg-blue-100 text-blue-700',
  AWAITING_CONFIRMATION: 'bg-stone-100 text-stone-700',
  COMPLETED:             'bg-emerald-100 text-emerald-700',
  DISPUTED:              'bg-red-100 text-red-700',
  CANCELLED:             'bg-stone-100 text-stone-500',
}

export default function AdminShipmentMonitoring() {
  const { user } = useAuth()
  const token = user?.token ?? ''

  const [shipments, setShipments] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'ALL') params.set('status', statusFilter)
      if (dateFrom) params.set('date_from', dateFrom)
      if (dateTo) params.set('date_to', dateTo)
      const q = params.toString() ? `?${params.toString()}` : ''
      const data = await apiRequest<Shipment[]>(`/api/admin/shipments${q}`, { token })
      setShipments(data)
    } catch (e) {
      setError((e as ApiError).message || 'Could not load shipments.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">All Shipments</h1>
          <p className="text-sm text-stone-600 mt-1">Monitor all shipments across the platform.</p>
        </div>
        <button type="button" onClick={load}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-600 hover:text-stone-900 hover:underline">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-white border border-stone-200 rounded-2xl p-4">
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-stone-200 text-sm text-stone-800 focus:outline-none focus:border-accent"
        >
          {STATUS_OPTIONS.map(s => (
            <option key={s} value={s}>{s === 'ALL' ? 'All statuses' : s}</option>
          ))}
        </select>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
          className="px-3 py-2 rounded-xl border border-stone-200 text-sm text-stone-800 focus:outline-none focus:border-accent" />
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
          className="px-3 py-2 rounded-xl border border-stone-200 text-sm text-stone-800 focus:outline-none focus:border-accent" />
        <button type="button" onClick={load}
          className="px-4 py-2 rounded-xl bg-sidebar text-white text-sm font-semibold hover:bg-stone-800">
          Apply
        </button>
        <button type="button" onClick={() => { setStatusFilter('ALL'); setDateFrom(''); setDateTo('') }}
          className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 text-sm font-semibold hover:bg-stone-50">
          Clear
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-7 h-7 rounded-full border-2 border-sidebar border-t-transparent animate-spin" />
        </div>
      ) : shipments.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-3xl p-10 text-center shadow-sm">
          <p className="text-stone-500 text-sm">No shipments found.</p>
        </div>
      ) : (
        <div className="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="px-4 py-3 font-semibold text-stone-700">Route</th>
                <th className="px-4 py-3 font-semibold text-stone-700">Shipper</th>
                <th className="px-4 py-3 font-semibold text-stone-700">Company</th>
                <th className="px-4 py-3 font-semibold text-stone-700">Truck</th>
                <th className="px-4 py-3 font-semibold text-stone-700">Price (RWF)</th>
                <th className="px-4 py-3 font-semibold text-stone-700">Status</th>
                <th className="px-4 py-3 font-semibold text-stone-700">Date</th>
              </tr>
            </thead>
            <tbody>
              {shipments.map(s => (
                <tr key={s.id} className="border-b border-stone-100 last:border-0 hover:bg-stone-50">
                  <td className="px-4 py-3 font-medium text-stone-800">
                    {s.pickup_district} → {s.dropoff_district}
                  </td>
                  <td className="px-4 py-3 text-stone-700">
                    <p className="font-semibold">{s.shipper_name}</p>
                    <p className="text-xs text-stone-400">{s.shipper_email}</p>
                  </td>
                  <td className="px-4 py-3 text-stone-700">{s.company_name ?? '—'}</td>
                  <td className="px-4 py-3 text-stone-700 font-mono text-xs">{s.truck_plate ?? '—'}</td>
                  <td className="px-4 py-3 font-semibold text-stone-900">
                    {Number(s.offered_price).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[s.status] ?? 'bg-stone-100 text-stone-600'}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-stone-500 text-xs">
                    {new Date(s.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
