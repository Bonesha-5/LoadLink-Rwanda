import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

type Stats = { truck_count: number; open_shipments: number }

export default function CompanyDashboard() {
  const { user, getToken } = useAuth()
  const [stats, setStats] = useState<Stats>({ truck_count: 0, open_shipments: 0 })

  useEffect(() => {
    const headers = { Authorization: `Bearer ${getToken()}` }
    Promise.all([
      fetch('/api/company/trucks', { headers }).then((r) => r.json()),
      fetch('/api/shipments/posted', { headers }).then((r) => r.json()),
    ]).then(([trucks, shipments]) => {
      setStats({
        truck_count: Array.isArray(trucks) ? trucks.length : 0,
        open_shipments: Array.isArray(shipments) ? shipments.length : 0,
      })
    }).catch(() => null)
  }, [])

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-stone-800 mb-1">Welcome, {user?.name}</h1>
      <p className="text-stone-600 mb-6">
        Rwanda&apos;s premier logistics marketplace. Get shipment requests from shippers, submit competitive offers, and grow your transport business.
      </p>
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-stone-200 p-4">
          <p className="text-2xl font-bold text-stone-800">{stats.truck_count}</p>
          <p className="text-stone-600 text-sm">Trucks in fleet</p>
        </div>
        <div className="bg-white rounded-xl border border-stone-200 p-4">
          <p className="text-2xl font-bold text-stone-800">{stats.open_shipments}</p>
          <p className="text-stone-600 text-sm">Open shipments</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-4">
        <Link
          to="/company/shipments"
          className="inline-flex items-center gap-2 px-6 py-3.5 bg-accent text-white font-semibold rounded-xl hover:bg-accent-hover transition-all shadow-lg hover:shadow-accent/25"
        >
          View Shipments
        </Link>
        <Link
          to="/company/trucks"
          className="inline-flex items-center gap-2 px-6 py-3.5 bg-white border-2 border-stone-200 text-stone-800 font-semibold rounded-xl hover:border-stone-300 hover:bg-stone-50 transition-all"
        >
          Manage Trucks
        </Link>
      </div>
    </div>
  )
}
