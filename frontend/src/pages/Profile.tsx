import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { apiRequest } from '../api/http'
import type { ApiError } from '../api/http'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

type Shipment = {
  id: number
  status: string
}

const STATUS_COLORS: Record<string, string> = {
  POSTED:                '#3B82F6',
  AWAITING_ESCROW:       '#F59E0B',
  ESCROW_FUNDED:         '#F59E0B',
  IN_TRANSIT:            '#8B5CF6',
  AWAITING_CONFIRMATION: '#6B7280',
  COMPLETED:             '#10B981',
  DISPUTED:              '#EF4444',
  CANCELLED:             '#374151',
}

const STATUS_LABELS: Record<string, string> = {
  POSTED:                'Posted',
  AWAITING_ESCROW:       'Awaiting Escrow',
  ESCROW_FUNDED:         'Escrow Funded',
  IN_TRANSIT:            'In Transit',
  AWAITING_CONFIRMATION: 'Awaiting Confirm',
  COMPLETED:             'Completed',
  DISPUTED:              'Disputed',
  CANCELLED:             'Cancelled',
}

export default function Profile() {
  const { user } = useAuth()

  const token = user?.token ||
    (() => { try { return JSON.parse(localStorage.getItem('loadlink_shipper') ?? '{}')?.token ?? '' } catch { return '' } })()

  const [shipments, setShipments] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const data = await apiRequest<Shipment[]>('/api/shipments/my', { token })
        setShipments(data)
      } catch (e) {
        console.error((e as ApiError).message)
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  const activeStatuses = new Set(['POSTED', 'AWAITING_ESCROW', 'ESCROW_FUNDED', 'IN_TRANSIT', 'AWAITING_CONFIRMATION'])

  const stats = {
    total:     shipments.length,
    active:    shipments.filter(s => activeStatuses.has(s.status)).length,
    completed: shipments.filter(s => s.status === 'COMPLETED').length,
    disputed:  shipments.filter(s => s.status === 'DISPUTED').length,
  }

  const chartData = (() => {
    if (shipments.length === 0) return []
    const counts: Record<string, number> = {}
    for (const s of shipments) {
      counts[s.status] = (counts[s.status] ?? 0) + 1
    }
    return Object.entries(counts).map(([k, v]) => ({
      stage: STATUS_LABELS[k] ?? k,
      count: v,
      color: STATUS_COLORS[k] ?? '#9CA3AF',
    }))
  })()

  return (
    <div className="space-y-6 ll-animate-in">
      <div className="rounded-3xl border border-stone-200 bg-gradient-to-r from-white via-slate-50 to-amber-50 p-6 shadow-sm">
        <h1 className="text-3xl font-bold text-stone-900">Dashboard</h1>
        <p className="text-sm text-stone-600 mt-1">Welcome back, {user?.name || 'Shipper'}. Here is your shipment overview.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Shipments" value={stats.total}     accent="text-stone-800" />
        <StatCard label="Active"          value={stats.active}    accent="text-blue-600" />
        <StatCard label="Completed"       value={stats.completed} accent="text-emerald-600" />
        <StatCard label="Disputed"        value={stats.disputed}  accent="text-red-600" />
      </div>

      {/* Chart */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm">
        <p className="text-sm font-semibold text-stone-700 mb-1">Shipments by Status</p>
        <p className="text-xs text-stone-400 mb-4">
          {loading ? 'Loading…' : shipments.length === 0 ? 'No shipments yet' : `${shipments.length} total shipments`}
        </p>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} barCategoryGap="35%">
              <XAxis dataKey="stage" tick={{ fontSize: 10, fill: '#78716c' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#78716c' }} axisLine={false} tickLine={false} width={24} />
              <Tooltip cursor={{ fill: '#f5f5f4' }} contentStyle={{ borderRadius: 12, border: '1px solid #e7e5e4', fontSize: 12 }} />
              <Bar dataKey="count" name="Shipments" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-48 flex items-center justify-center">
            <p className="text-stone-400 text-sm">Post shipments to see your chart</p>
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <QuickLink to="/post-shipment" label="Post Shipment" desc="Create a new load for companies to bid on" />
        <QuickLink to="/loads" label="My Shipments" desc="View and manage all your posted shipments" />
        <QuickLink to="/payments" label="Payment History" desc="View all your escrow payments" />
      </div>
    </div>
  )
}

function StatCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="bg-white rounded-3xl border border-stone-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <p className="text-[11px] font-semibold text-stone-500 uppercase tracking-wide">{label}</p>
      <p className={`text-3xl font-bold mt-2 ${accent}`}>{value}</p>
    </div>
  )
}

function QuickLink({ to, label, desc }: { to: string; label: string; desc: string }) {
  return (
    <Link to={to} className="bg-white rounded-3xl border border-stone-200 p-5 shadow-sm hover:border-accent/40 hover:shadow-md transition-all block group">
      <p className="text-sm font-bold text-stone-900 group-hover:text-accent transition-colors">{label}</p>
      <p className="text-xs text-stone-500 mt-1">{desc}</p>
    </Link>
  )
}
