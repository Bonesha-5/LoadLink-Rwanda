import { useMemo, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ensureSeedLoads, getAllLoads, getStageMap, type ShipStage } from '../data/storage'
import CustomerShipmentMap, { type ShipmentMarker } from '../components/CustomerShipmentMap'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

// Rwanda district coordinate lookup
const RWANDA_COORDS: Record<string, [number, number]> = {
  kigali:     [-1.9441, 30.0619],
  gasabo:     [-1.9441, 30.0619],
  nyarugenge: [-1.9536, 30.0605],
  kicukiro:   [-1.9706, 30.1044],
  musanze:    [-1.4989, 29.6346],
  rubavu:     [-1.6834, 29.3644],
  huye:       [-2.5967, 29.7444],
  muhanga:    [-2.0833, 29.7500],
  karongi:    [-2.0103, 29.3778],
  rusizi:     [-2.4811, 28.9078],
  nyagatare:  [-1.2967, 30.3283],
  rwamagana:  [-1.9489, 30.4344],
  ngoma:      [-2.1500, 30.5000],
  kayonza:    [-1.9500, 30.6000],
  gicumbi:    [-1.5800, 30.1000],
  rulindo:    [-1.7200, 29.9800],
}

const ROUTE_STEPS = 7

function interpolateRoute(from: [number, number], to: [number, number]): [number, number][] {
  return Array.from({ length: ROUTE_STEPS }, (_, i) => [
    from[0] + (to[0] - from[0]) * (i / (ROUTE_STEPS - 1)),
    from[1] + (to[1] - from[1]) * (i / (ROUTE_STEPS - 1)),
  ] as [number, number])
}

// Demo route: Gasabo (Kigali) → Rubavu (Gisenyi)
const DEMO_ROUTE: [number, number][] = [
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
  ESCROW_FUNDED:         '#0D9488',
  IN_TRANSIT:            '#8B5CF6',
  AWAITING_CONFIRMATION: '#44403c',
  COMPLETED:             '#10B981',
  DISPUTED:              '#EF4444',
  CANCELLED:             '#a8a29e',
}

const STAGE_LABELS: Record<ShipStage, string> = {
  POSTED:                'Posted',
  AWAITING_ESCROW:       'Awaiting Escrow',
  ESCROW_FUNDED:         'Escrow Funded',
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
  const [truckIdx, setTruckIdx]       = useState(0)
  const [lastUpdated, setLastUpdated] = useState(new Date())

  // Animate trucks every 3 s
  useEffect(() => {
    const iv = setInterval(() => {
      setTruckIdx((i) => (i + 1) % ROUTE_STEPS)
      setLastUpdated(new Date())
    }, 3000)
    return () => clearInterval(iv)
  }, [])

  const { myLoads, stageMap } = useMemo(() => {
    ensureSeedLoads(user?.name || 'Shipper')
    const loads  = getAllLoads()
    const stages = getStageMap()
    return {
      myLoads:  loads.filter((l) => l.createdBy === (user?.name || 'Shipper')),
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

  // Build active routes for all IN_TRANSIT / AWAITING_CONFIRMATION shipments
  const activeRoutes = useMemo(() => {
    const active = myLoads.filter((l) => {
      const s = stageMap[l.id] ?? 'POSTED'
      return s === 'IN_TRANSIT' || s === 'AWAITING_CONFIRMATION'
    })
    if (active.length === 0) return null
    return active.map((l) => {
      const pickup  = RWANDA_COORDS[l.origin.toLowerCase()]      ?? [-1.9441, 30.0619] as [number, number]
      const dropoff = RWANDA_COORDS[l.destination.toLowerCase()] ?? [-1.4989, 29.6346] as [number, number]
      return {
        id:     l.id,
        pickup,
        dropoff,
        route:  interpolateRoute(pickup, dropoff),
        label:  `${l.origin} → ${l.destination}`,
      }
    })
  }, [myLoads, stageMap])

  // Compose ShipmentMarker props for the map
  const mapShipments = useMemo<ShipmentMarker[]>(() => {
    if (activeRoutes) {
      return activeRoutes.map((r) => ({
        id:      r.id,
        pickup:  r.pickup,
        dropoff: r.dropoff,
        truck:   r.route[truckIdx],
        label:   r.label,
      }))
    }
    // Demo fallback
    return [{
      id:      'demo',
      pickup:  DEMO_ROUTE[0],
      dropoff: DEMO_ROUTE[DEMO_ROUTE.length - 1],
      truck:   DEMO_ROUTE[truckIdx],
      label:   'Gasabo → Rubavu · Demo',
    }]
  }, [activeRoutes, truckIdx])

  const mapSubtitle = activeRoutes
    ? `${activeRoutes.length} active shipment${activeRoutes.length !== 1 ? 's' : ''} in transit · trucks move every 3s`
    : 'Demo data — Gasabo → Rubavu · Truck moves every 3s'

  return (
    <div className="space-y-6 ll-animate-in">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Dashboard</h1>
        <p className="text-sm text-stone-600 mt-1">Welcome back, {user?.name || 'Shipper'}</p>
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
        <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm">
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

        <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-semibold text-stone-700">Live Shipment Map</p>
            <span className="text-xs text-stone-400">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          </div>
          <p className="text-xs text-stone-400 mb-4">{mapSubtitle}</p>
          <CustomerShipmentMap shipments={mapShipments} />
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
    <div className="bg-white rounded-3xl border border-stone-200 p-5 shadow-sm">
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
