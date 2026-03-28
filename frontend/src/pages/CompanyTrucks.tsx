import { useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  getTrucksByCompany,
  addTruck as addTruckStorage,
  deleteTruck as deleteTruckStorage,
} from '../data/storage'

export default function CompanyTrucks() {
  const { user } = useAuth()
  const companyName = user?.name ?? ''
  const [refresh, setRefresh] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [capacity, setCapacity] = useState('')
  const [location, setLocation] = useState('')
  const [plateNumber, setPlateNumber] = useState('')

  const trucks = useMemo(() => {
    void refresh
    return getTrucksByCompany(companyName)
  }, [companyName, refresh])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!capacity.trim() || !location.trim()) return
    addTruckStorage({ companyName, capacity: capacity.trim(), location: location.trim(), plateNumber: plateNumber.trim() || undefined })
    setCapacity('')
    setLocation('')
    setPlateNumber('')
    setShowForm(false)
    setRefresh((v) => v + 1)
  }

  function handleDelete(id: string) {
    if (window.confirm('Remove this truck from your fleet?')) {
      deleteTruckStorage(id)
      setRefresh((v) => v + 1)
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">My Trucks</h1>
          <p className="text-stone-600 mt-1">Manage your fleet. Add trucks to submit offers on shipments.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-white font-semibold rounded-xl hover:bg-accent-hover transition-all shadow-lg shadow-accent/20"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8v8m-8-8H4" />
          </svg>
          Add truck
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-lg p-6 mb-8">
          <h2 className="text-lg font-bold text-stone-800 mb-4">Add a truck</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="capacity" className="block text-sm font-semibold text-stone-700 mb-2">Capacity (tons)</label>
              <input
                id="capacity"
                type="text"
                placeholder="e.g. 10"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
            </div>
            <div>
              <label htmlFor="location" className="block text-sm font-semibold text-stone-700 mb-2">Current location</label>
              <input
                id="location"
                type="text"
                placeholder="e.g. Kigali"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
            </div>
            <div>
              <label htmlFor="plate" className="block text-sm font-semibold text-stone-700 mb-2">Plate number (optional)</label>
              <input
                id="plate"
                type="text"
                placeholder="e.g. RAB 123 A"
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 bg-accent text-white font-semibold rounded-xl hover:bg-accent-hover"
              >
                Save truck
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setCapacity(''); setLocation(''); setPlateNumber('') }}
                className="px-5 py-2.5 bg-stone-100 text-stone-700 font-semibold rounded-xl hover:bg-stone-200"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {trucks.length === 0 && !showForm ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-10 text-center">
          <p className="text-stone-600 mb-4">You haven&apos;t added any trucks yet.</p>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="text-accent font-semibold hover:underline"
          >
            Add your first truck
          </button>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {trucks.map((truck) => (
            <li
              key={truck.id}
              className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start gap-2">
                <div>
                  <p className="font-semibold text-stone-800">{truck.capacity} tons</p>
                  <p className="text-stone-600 text-sm mt-1">Location: {truck.location}</p>
                  {truck.plateNumber && (
                    <p className="text-stone-500 text-sm">Plate: {truck.plateNumber}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(truck.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Remove truck"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
