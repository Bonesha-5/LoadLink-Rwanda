import { useEffect, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ensureSeedAdminData, getAdminAnalytics } from '../data/storage'

type RevenuePoint = {
  month: string
  revenue: number
  shipments: number
}

type StatusSummary = {
  status: string
  count: number
}

type FetchState = 'idle' | 'loading' | 'error' | 'success'

const PIE_COLORS = ['#F5C518', '#0B0B0F', '#6B7280', '#C9A227', '#9CA3AF']

function formatStatusLabel(status: string): string {
  const map: Record<string, string> = {
    POSTED: 'Posted',
    AWAITING_ESCROW: 'Awaiting escrow',
    ESCROW_FUNDED: 'Escrow funded',
    IN_TRANSIT: 'In transit',
    AWAITING_CONFIRMATION: 'Awaiting confirmation',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
    DISPUTED: 'Disputed',
  }
  return map[status] ?? status
}

export default function AdminAnalytics() {
  const [revenueData, setRevenueData] = useState<RevenuePoint[]>([])
  const [statusSummary, setStatusSummary] = useState<StatusSummary[]>([])
  const [, setState] = useState<FetchState>('idle')

  useEffect(() => {
    async function loadAnalytics() {
      setState('loading')
      try {
        ensureSeedAdminData()
        const data = getAdminAnalytics()
        setRevenueData(data.revenue)
        setStatusSummary(data.statuses)
        setState('success')
      } catch (err) {
        console.error(err)
        setRevenueData([])
        setStatusSummary([])
        setState('error')
      }
    }

    void loadAnalytics()
  }, [])

  const totalRevenue = revenueData.reduce((sum, p) => sum + p.revenue, 0)
  const totalShipments = revenueData.reduce((sum, p) => sum + p.shipments, 0)
  const activeShipments = statusSummary
    .filter((s) => ['ESCROW_FUNDED', 'IN_TRANSIT', 'AWAITING_CONFIRMATION'].includes(s.status))
    .reduce((sum, s) => sum + s.count, 0)

  return (
    <div className="max-w-6xl space-y-8 ll-animate-in">
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-3xl border border-stone-200 p-5 shadow-sm transition-shadow hover:shadow-md">
          <p className="text-xs font-medium uppercase tracking-wide text-stone-500 mb-1">
            Total revenue (demo)
          </p>
          <p className="text-2xl font-bold text-stone-900">
            {totalRevenue.toLocaleString()} RWF
          </p>
          <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-accent/10 text-accent border border-accent/20 px-2.5 py-1 text-xs font-semibold">
            +14% vs last period
          </span>
        </div>
        <div className="bg-white rounded-3xl border border-stone-200 p-5 shadow-sm transition-shadow hover:shadow-md">
          <p className="text-xs font-medium uppercase tracking-wide text-stone-500 mb-1">
            Shipments processed
          </p>
          <p className="text-2xl font-bold text-stone-900">{totalShipments}</p>
          <p className="text-xs text-stone-500 mt-1">Last 6 months (demo)</p>
        </div>
        <div className="bg-white rounded-3xl border border-stone-200 p-5 shadow-sm transition-shadow hover:shadow-md">
          <p className="text-xs font-medium uppercase tracking-wide text-stone-500 mb-1">
            Active shipments
          </p>
          <p className="text-2xl font-bold text-stone-900">{activeShipments}</p>
          <p className="text-xs text-stone-500 mt-1">
            Escrow funded, in transit, or awaiting confirmation
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl border border-stone-200 p-5 shadow-sm lg:col-span-2 transition-shadow hover:shadow-md">
          <h2 className="text-sm font-semibold text-stone-800 mb-1">Revenue over time</h2>
          <p className="text-xs text-stone-500 mb-4">
            Monthly escrow volume and number of shipments completed on the platform.
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ left: -20, right: 10, top: 10 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F5C518" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#F5C518" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value: number) => `${Math.round(value / 1_000_000)}M`}
                />
                <Tooltip
                  formatter={(value: unknown, name: unknown) => {
                    const v = typeof value === 'number' ? value : 0
                    return name === 'revenue'
                      ? [`${v.toLocaleString()} RWF`, 'Revenue']
                      : [v, 'Shipments']
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke="#F5C518"
                  strokeWidth={2}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-stone-200 p-5 shadow-sm transition-shadow hover:shadow-md">
          <h2 className="text-sm font-semibold text-stone-800 mb-1">Shipments by status</h2>
          <p className="text-xs text-stone-500 mb-4">
            Distribution across lifecycle stages (pie chart).
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusSummary.map((s, i) => ({
                    ...s,
                    name: formatStatusLabel(s.status),
                    fill: PIE_COLORS[i % PIE_COLORS.length],
                  }))}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={2}
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                >
                  {statusSummary.map((s, i) => (
                    <Cell key={s.status} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: unknown, n: unknown) => [String(v ?? ''), String(n ?? '')]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </div>
  )
}

