import { useMemo, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getAllLoads, getStageMap, type ShipStage } from '../data/storage'
import CustomerShipmentMap from '../components/CustomerShipmentMap'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

// Animated route: Gasabo (Kigali) → Rubavu (Gisenyi)
const ROUTE: [number, number][] = [
  [-1.9536, 30.0605],
  [-1.92,   29.95],
  [-1.87,   29.82],
  [-1.85,   29.70],
  [-1.78,   29.55],
  [-1.73,   29.40],
  [-1.7028, 29.2569],
]

const STAGE_COLORS: Record<ShipStage, string> = {
  POSTED:                '#3B82F6',
  AWAITING_ESCROW:       '#F59E0B',
  IN_TRANSIT:            '#8B5CF6',
  AWAITING_CONFIRMATION: '#6B7280',
  COMPLETED:             '#10B981',
  DISPUTED:              '#EF4444',
  CANCELLED:             '#374151',
}

const STAGE_LABELS: Record<ShipStage, string> = {
  POSTED:                'Posted',
  AWAITING_ESCROW:       'Awaiting Escrow',
  IN_TRANSIT:            'In Transit',
  AWAITING_CONFIRMATION: 'Awaiting Confirm',
  COMPLETED:             'Completed',
  DISPUTED:              'Disputed',
  CANCELLED:             'Cancelled',
}

const DEMO_CHART = [
  { stage: 'Posted',     count: 3, color: STAGE_COLORS.POSTED },
  { stage: 'In Transit', count: 2, color: STAGE_COLORS.IN_TRANSIT },
  { stage: 'Completed',  count: 5, color: STAGE_COLORS.COMPLETED },
  { stage: 'Disputed',   count: 1, color: STAGE_COLORS.DISPUTED },
]

export default function Profile() {
  const { user } = useAuth()
  const [truckIdx, setTruckIdx] = useState(0)
  const [lastUpdated, setLastUpdated] = useState(new Date())

  // Animate truck along route every 3 s; full reset every hour
  useEffect(() => {
    const move = setInterval(() => {
      setTruckIdx((i) => (i + 1) % ROUTE.length)
      setLastUpdated(new Date())
    }, 3000)
    const reset = setInterval(() => {
      setTruckIdx(0)
      setLastUpdated(new Date())
    }, 3_600_000)
    return () => { clearInterval(move); clearInterval(reset) }
  }, [])

  const { myLoads, stageMap } = useMemo(() => {
    const loads = getAllLoads()
    const stages = getStageMap()
    return {
      myLoads: loads.filter((l) => l.createdBy === (user?.name || 'Shipper')),
      stageMap: stages,
    }
  }, [user?.name])

  const stats = useMemo(() => {
    const active = myLoads.filter((l) => {
      const s = stageMap[l.id] ?? 'POSTED'
      return s === 'POSTED' || s === 'AWAITING_ESCROW' || s === 'IN_TRANSIT' || s === 'AWAITING_CONFIRMATION'
    }).length
    const completed = myLoads.filter((l) => stageMap[l.id] === 'COMPLETED').length
    const disputed  = myLoads.filter((l) => stageMap[l.id] === 'DISPUTED').length
    return { total: myLoads.length, active, completed, disputed }
  }, [myLoads, stageMap])

  const chartData = useMemo(() => {
    if (myLoads.length === 0) return DEMO_CHART
    const counts: Partial<Record<ShipStage, number>> = {}
    for (const l of myLoads) {
      const s = (stageMap[l.id] ?? 'POSTED') as ShipStage
      counts[s] = (counts[s] ?? 0) + 1
    }
    return Object.entries(counts).map(([k, v]) => ({
      stage: STAGE_LABELS[k as ShipStage],
      count: v ?? 0,
      color: STAGE_COLORS[k as ShipStage],
    }))
  }, [myLoads, stageMap])

  const pickup: [number, number] = ROUTE[0]
  const dropoff: [number, number] = ROUTE[ROUTE.length - 1]
  const truck:   [number, number] = ROUTE[truckIdx]

  return (
    <div className="space-y-6 ll-animate-in">
      <div className="rounded-3xl border border-stone-200 bg-gradient-to-r from-white via-slate-50 to-amber-50 p-6 shadow-sm">
        <h1 className="text-3xl font-bold text-stone-900">Dashboard</h1>
        <p className="text-sm text-stone-600 mt-1">Welcome back, {user?.name || 'Shipper'}. Here is your live shipment overview.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Shipments" value={stats.total}    accent="text-stone-800" />
        <StatCard label="Active"          value={stats.active}   accent="text-blue-600"  />
        <StatCard label="Completed"       value={stats.completed} accent="text-emerald-600" />
        <StatCard label="Disputed"        value={stats.disputed} accent="text-red-600"   />
      </div>

      {/* Chart + Map */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-sm font-semibold text-stone-700 mb-1">Shipments by Status</p>
          <p className="text-xs text-stone-400 mb-4">
            {myLoads.length === 0 ? 'Demo data — post shipments to see real chart' : `${myLoads.length} total shipments`}
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} barCategoryGap="35%">
              <XAxis
                dataKey="stage"
                tick={{ fontSize: 10, fill: '#78716c' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 10, fill: '#78716c' }}
                axisLine={false}
                tickLine={false}
                width={24}
              />
              <Tooltip
                cursor={{ fill: '#f5f5f4' }}
                contentStyle={{ borderRadius: 12, border: '1px solid #e7e5e4', fontSize: 12 }}
              />
              <Bar dataKey="count" name="Shipments" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-semibold text-stone-700">Live Shipment Map</p>
            <span className="text-xs text-stone-400">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          </div>
          <p className="text-xs text-stone-400 mb-4">
            Gasabo → Rubavu · Truck moves every 3 s · resets hourly
          </p>
          <CustomerShipmentMap pickup={pickup} dropoff={dropoff} truck={truck} />
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <QuickLink
          to="/post-shipment"
          label="Post Shipment"
          desc="Create a new load for companies to bid on"
        />
        <QuickLink
          to="/loads"
          label="My Shipments"
          desc="View and manage all your posted shipments"
        />
        <QuickLink
          to="/interested-trucks"
          label="Interested Trucks"
          desc="Review trucks that responded to your loads"
        />
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
    <Link
      to={to}
      className="bg-white rounded-3xl border border-stone-200 p-5 shadow-sm hover:border-accent/40 hover:shadow-md transition-all block group"
    >
      <p className="text-sm font-bold text-stone-900 group-hover:text-accent transition-colors">{label}</p>
      <p className="text-xs text-stone-500 mt-1">{desc}</p>
    </Link>
  )
}
