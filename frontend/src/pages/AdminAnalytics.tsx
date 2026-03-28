import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ensureSeedAdminData, getAdminDisputes, getAdminShipments, getAuditLogs, getPendingCompanies } from '../data/storage'

type FetchState = 'idle' | 'loading' | 'error' | 'success'

const PIE_COLORS = ['#F5C518', '#0B0B0F', '#6B7280', '#C9A227', '#9CA3AF', '#D1D5DB']

function formatStatusLabel(status: string): string {
  const map: Record<string, string> = {
    POSTED: 'Posted',
    AWAITING_ESCROW: 'Waiting for payment',
    ESCROW_FUNDED: 'Payment received',
    IN_TRANSIT: 'On the way',
    AWAITING_CONFIRMATION: 'Waiting for confirmation',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
    DISPUTED: 'Disputed',
  }
  return map[status] ?? status
}

function dayKey(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'Unknown'
  return d.toISOString().slice(0, 10) // YYYY-MM-DD
}

function formatShortDay(yyyyMmDd: string): string {
  const d = new Date(`${yyyyMmDd}T00:00:00`)
  if (Number.isNaN(d.getTime())) return yyyyMmDd
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export default function AdminAnalytics() {
  const [state, setState] = useState<FetchState>('idle')
  const [error, setError] = useState<string | null>(null)

  const [pendingCompaniesCount, setPendingCompaniesCount] = useState(0)
  const [shipmentsCount, setShipmentsCount] = useState(0)
  const [disputesCount, setDisputesCount] = useState(0)
  const [recentEventsCount, setRecentEventsCount] = useState(0)
  const [shipmentStageSummary, setShipmentStageSummary] = useState<{ label: string; count: number }[]>([])
  const [shipmentsTrend, setShipmentsTrend] = useState<{ day: string; label: string; shipments: number }[]>([])

  const refresh = useCallback(() => {
    setState('loading')
    setError(null)
    try {
      ensureSeedAdminData()

      const pendingCompanies = getPendingCompanies()
      const shipments = getAdminShipments()
      const disputes = getAdminDisputes()
      const audit = getAuditLogs()

      setPendingCompaniesCount(pendingCompanies.length)
      setShipmentsCount(shipments.length)
      setDisputesCount(disputes.length)

      const weekAgo = Date.now() - 7 * 86_400_000
      setRecentEventsCount(audit.filter((e) => new Date(e.createdAt).getTime() >= weekAgo).length)

      const stageCounts = new Map<string, number>()
      for (const s of shipments) stageCounts.set(s.status, (stageCounts.get(s.status) ?? 0) + 1)
      const summary = Array.from(stageCounts.entries())
        .map(([status, count]) => ({ label: formatStatusLabel(status), count }))
        .sort((a, b) => b.count - a.count)
      setShipmentStageSummary(summary)

      // Clear trend: "new shipments created per day" over the last 14 days
      const days = 14
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const dayCounts = new Map<string, number>()
      for (const s of shipments) {
        const k = dayKey(s.createdAt)
        dayCounts.set(k, (dayCounts.get(k) ?? 0) + 1)
      }

      const trend = Array.from({ length: days }).map((_, idx) => {
        const d = new Date(today)
        d.setDate(today.getDate() - (days - 1 - idx))
        const key = d.toISOString().slice(0, 10)
        return {
          day: key,
          label: formatShortDay(key),
          shipments: dayCounts.get(key) ?? 0,
        }
      })
      setShipmentsTrend(trend)

      setState('success')
    } catch (e) {
      console.error(e)
      setError('Could not load admin dashboard data.')
      setState('error')
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const primaryCards = useMemo(
    () => [
      {
        title: 'Company checks',
        value: pendingCompaniesCount,
        helper: 'Companies waiting for approval',
        to: '/admin/companies',
        tone: 'border-stone-200',
      },
      {
        title: 'All shipments',
        value: shipmentsCount,
        helper: 'Every shipment on the platform',
        to: '/admin/shipments',
        tone: 'border-stone-200',
      },
      {
        title: 'Disputes',
        value: disputesCount,
        helper: 'Shipments reported as a problem',
        to: '/admin/disputes',
        tone: disputesCount > 0 ? 'border-red-200 ring-1 ring-red-100' : 'border-stone-200',
      },
      {
        title: 'Activity log',
        value: recentEventsCount,
        helper: 'Actions in the last 7 days',
        to: '/admin/audit-log',
        tone: 'border-stone-200',
      },
    ],
    [pendingCompaniesCount, shipmentsCount, disputesCount, recentEventsCount],
  )

  return (
    <div className="max-w-6xl space-y-8 ll-animate-in">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Admin</p>
          <h1 className="text-2xl font-bold text-stone-900 mt-1">Dashboard</h1>
          <p className="text-sm text-stone-600 mt-1 max-w-2xl">
            This page shows what needs attention today: companies waiting for approval, shipment progress, disputes, and recent admin actions.
          </p>
        </div>
        <button
          type="button"
          onClick={refresh}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-sidebar text-white text-sm font-semibold hover:bg-stone-800 transition-colors shadow-sm border border-stone-800"
        >
          <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {state === 'error' && error && (
        <p className="text-red-600 text-sm rounded-2xl border border-red-100 bg-red-50 px-4 py-3">{error}</p>
      )}

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {primaryCards.map((c) => (
          <Link
            key={c.title}
            to={c.to}
            className={`group bg-white rounded-3xl border ${c.tone} p-5 shadow-sm transition-shadow hover:shadow-md`}
          >
            <p className="text-xs font-semibold text-stone-500">{c.title}</p>
            <p className="mt-2 text-3xl font-extrabold text-stone-900 tabular-nums">{c.value}</p>
            <p className="mt-1 text-xs text-stone-500">{c.helper}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-accent">
              Open
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </Link>
        ))}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl border border-stone-200 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-stone-800 mb-1">Shipments by stage</h2>
          <p className="text-xs text-stone-500 mb-4">A quick visual of where shipments are right now.</p>

          {state === 'loading' && <p className="text-sm text-stone-500">Loading…</p>}

          {state === 'success' && shipmentStageSummary.length === 0 && (
            <p className="text-sm text-stone-500">No shipments yet.</p>
          )}

          {shipmentStageSummary.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={shipmentStageSummary.map((s, i) => ({
                        name: s.label,
                        value: s.count,
                        fill: PIE_COLORS[i % PIE_COLORS.length],
                      }))}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={2}
                    >
                      {shipmentStageSummary.map((s, i) => (
                        <Cell key={s.label} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: unknown, name: unknown) => [String(value ?? ''), String(name ?? '')]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="space-y-2">
                {shipmentStageSummary.slice(0, 7).map((row) => (
                  <li key={row.label} className="flex items-center justify-between gap-4">
                    <span className="text-sm text-stone-700">{row.label}</span>
                    <span className="text-sm font-bold text-stone-900 tabular-nums">{row.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="bg-white rounded-3xl border border-stone-200 p-5 shadow-sm space-y-6">
          <div>
            <h2 className="text-sm font-semibold text-stone-800 mb-1">Shipments over time</h2>
            <p className="text-xs text-stone-500 mb-4">New shipments created per day (last 14 days).</p>

            {shipmentsTrend.length === 0 ? (
              <p className="text-sm text-stone-500">Not enough data yet.</p>
            ) : (
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={shipmentsTrend} margin={{ left: -20, right: 10, top: 10 }}>
                    <defs>
                      <linearGradient id="colorShipments" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#F5C518" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#F5C518" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} interval={3} />
                    <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip
                      formatter={(v: unknown) => [String(v ?? ''), 'New shipments']}
                      labelFormatter={(label: unknown) => String(label ?? '')}
                    />
                    <Area type="monotone" dataKey="shipments" stroke="#F5C518" strokeWidth={2} fill="url(#colorShipments)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div>
            <h2 className="text-sm font-semibold text-stone-800 mb-1">What admins can do</h2>
            <p className="text-xs text-stone-500 mb-4">Quick reminders of your main actions.</p>

            <ul className="space-y-3 text-sm text-stone-700">
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-accent shrink-0" />
                Approve or reject companies after checking their documents.
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-accent shrink-0" />
                Monitor all shipments and see their current stage.
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-accent shrink-0" />
                Handle disputes and decide how the held payment is released.
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-accent shrink-0" />
                Review the activity log to keep a clear record of actions.
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}

