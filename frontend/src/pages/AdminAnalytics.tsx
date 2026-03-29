import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { apiRequest } from '../api/http'
import type { ApiError } from '../api/http'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, PieChart, Pie, Cell, Legend,
} from 'recharts'

type Stats = {
  total_shipments: number
  completed: number
  disputed: number
  active: number
  total_revenue: number
  pending_companies: number
}

type StatusBreakdown = { status: string; count: number }

const STATUS_COLORS: Record<string, string> = {
  POSTED: '#3B82F6',
  AWAITING_ESCROW: '#F59E0B',
  ESCROW_FUNDED: '#F59E0B',
  IN_TRANSIT: '#8B5CF6',
  AWAITING_CONFIRMATION: '#6B7280',
  COMPLETED: '#10B981',
  DISPUTED: '#EF4444',
  CANCELLED: '#374151',
}

export default function AdminAnalytics() {
  const { user } = useAuth()
  const token = user?.token ?? ''

  const [shipments, setShipments] = useState<StatusBreakdown[]>([])
  const [stats, setStats] = useState<Stats>({
    total_shipments: 0, completed: 0, disputed: 0,
    active: 0, total_revenue: 0, pending_companies: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [allShipments, pending] = await Promise.all([
          apiRequest<any[]>('/api/admin/shipments', { token }),
          apiRequest<any[]>('/api/admin/companies/pending', { token }),
        ])

        // Calculate stats from shipments
        const breakdown: Record<string, number> = {}
        let completed = 0, disputed = 0, active = 0

        for (const s of allShipments) {
          breakdown[s.status] = (breakdown[s.status] ?? 0) + 1
          if (s.status === 'COMPLETED') completed++
          if (s.status === 'DISPUTED') disputed++
          if (['ESCROW_FUNDED', 'IN_TRANSIT', 'AWAITING_CONFIRMATION'].includes(s.status)) active++
        }

        setShipments(Object.entries(breakdown).map(([status, count]) => ({ status, count })))
        setStats({
          total_shipments: allShipments.length,
          completed,
          disputed,
          active,
          total_revenue: 0,
          pending_companies: pending.length,
        })
      } catch (e) {
        setError((e as ApiError).message || 'Could not load analytics.')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="w-7 h-7 rounded-full border-2 border-sidebar border-t-transparent animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Analytics</h1>
        <p className="text-sm text-stone-600 mt-1">Platform-wide overview.</p>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Shipments', value: stats.total_shipments, color: 'text-stone-900' },
          { label: 'Active',          value: stats.active,          color: 'text-blue-600' },
          { label: 'Completed',       value: stats.completed,       color: 'text-emerald-600' },
          { label: 'Disputed',        value: stats.disputed,        color: 'text-red-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-3xl border border-stone-200 p-5 shadow-sm">
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">{s.label}</p>
            <p className={`text-3xl font-bold mt-2 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm">
          <p className="text-sm font-semibold text-stone-700 mb-4">Shipments by Status</p>
          {shipments.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={shipments} barCategoryGap="35%">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="status" tick={{ fontSize: 9, fill: '#78716c' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#78716c' }} axisLine={false} tickLine={false} width={24} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e7e5e4', fontSize: 12 }} />
                <Bar dataKey="count" name="Shipments" radius={[6, 6, 0, 0]}>
                  {shipments.map((s, i) => (
                    <Cell key={i} fill={STATUS_COLORS[s.status] ?? '#9CA3AF'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center">
              <p className="text-stone-400 text-sm">No shipment data yet</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm">
          <p className="text-sm font-semibold text-stone-700 mb-4">Status Distribution</p>
          {shipments.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={shipments} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80}>
                  {shipments.map((s, i) => (
                    <Cell key={i} fill={STATUS_COLORS[s.status] ?? '#9CA3AF'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e7e5e4', fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center">
              <p className="text-stone-400 text-sm">No data yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Pending companies */}
      {stats.pending_companies > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
          <p className="text-sm font-semibold text-amber-900">
            {stats.pending_companies} company{stats.pending_companies > 1 ? 'ies' : ''} waiting for verification
          </p>
        </div>
      )}
    </div>
  )
}
