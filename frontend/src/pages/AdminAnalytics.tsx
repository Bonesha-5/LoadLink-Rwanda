import { useEffect, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
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

export default function AdminAnalytics() {
  const [revenueData, setRevenueData] = useState<RevenuePoint[]>([])
  const [statusSummary, setStatusSummary] = useState<StatusSummary[]>([])
  const [state, setState] = useState<FetchState>('idle')

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
    <div className="max-w-6xl space-y-8">
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-stone-500 mb-1">
            Total revenue (demo)
          </p>
          <p className="text-2xl font-bold text-stone-900">
            {totalRevenue.toLocaleString()} RWF
          </p>
          <p className="text-xs text-accent mt-1">+14% vs last period</p>
        </div>
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-stone-500 mb-1">
            Shipments processed
          </p>
          <p className="text-2xl font-bold text-stone-900">{totalShipments}</p>
          <p className="text-xs text-stone-500 mt-1">Last 6 months (demo)</p>
        </div>
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
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
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm lg:col-span-2">
          <h2 className="text-sm font-semibold text-stone-800 mb-1">Revenue over time</h2>
          <p className="text-xs text-stone-500 mb-4">
            Monthly escrow volume and number of shipments completed on the platform.
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ left: -20, right: 10, top: 10 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#E85D04" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#E85D04" stopOpacity={0} />
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
                  formatter={(value: number, name) =>
                    name === 'revenue'
                      ? [`${value.toLocaleString()} RWF`, 'Revenue']
                      : [value, 'Shipments']
                  }
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke="#E85D04"
                  strokeWidth={2}
                  fill="url(#colorRevenue)"
                />
                <Bar dataKey="shipments" name="Shipments" fill="#4A342C" opacity={0.9} barSize={18} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-stone-800 mb-1">Shipments by status</h2>
          <p className="text-xs text-stone-500 mb-4">
            Distribution of shipments across key lifecycle stages.
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusSummary} layout="vertical" margin={{ left: 40, right: 10, top: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="status"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value: string) => {
                    switch (value) {
                      case 'ESCROW_FUNDED':
                        return 'Escrow funded'
                      case 'IN_TRANSIT':
                        return 'In transit'
                      case 'AWAITING_CONFIRMATION':
                        return 'Awaiting confirmation'
                      case 'COMPLETED':
                        return 'Completed'
                      case 'DISPUTED':
                        return 'Disputed'
                      default:
                        return value
                    }
                  }}
                />
                <Tooltip formatter={(value: number) => [value, 'Shipments']} labelFormatter={() => ''} />
                <Bar dataKey="count" radius={[0, 999, 999, 0]} fill="#E85D04" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </div>
  )
}

