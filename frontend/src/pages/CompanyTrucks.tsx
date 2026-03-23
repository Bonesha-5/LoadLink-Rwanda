import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

type Truck = {
  id: number
  plate_number: string
  truck_type: string
  declared_capacity: number
  availability_status: string
  rating_average: number | null
}

const STATUS_STYLES: Record<string, string> = {
  AVAILABLE: 'bg-green-100 text-green-700',
  RESERVED: 'bg-yellow-100 text-yellow-700',
  IN_TRANSIT: 'bg-orange-100 text-orange-700',
  UNAVAILABLE: 'bg-stone-100 text-stone-500',
}

export default function CompanyTrucks() {
  const { getToken } = useAuth()
  const [trucks, setTrucks] = useState<Truck[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/company/trucks', {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => r.json())
      .then((data) => setTrucks(Array.isArray(data) ? data : []))
      .catch(() => setTrucks([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-stone-500">Loading trucks...</p>

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-800">My Trucks</h1>
        <p className="text-stone-600 mt-1">Your registered fleet. Trucks are added during company registration.</p>
      </div>

      {trucks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-10 text-center">
          <p className="text-stone-600">No trucks registered yet.</p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {trucks.map((truck) => (
            <li key={truck.id} className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5">
              <div className="flex justify-between items-start gap-2">
                <div className="space-y-1">
                  <p className="font-bold text-stone-800">{truck.plate_number}</p>
                  <p className="text-stone-600 text-sm">{truck.truck_type} · {truck.declared_capacity} tons</p>
                  {truck.rating_average !== null && (
                    <p className="text-stone-500 text-sm">Rating: {Number(truck.rating_average).toFixed(1)} ★</p>
                  )}
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLES[truck.availability_status] ?? 'bg-stone-100 text-stone-500'}`}>
                  {truck.availability_status.replace(/_/g, ' ')}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
