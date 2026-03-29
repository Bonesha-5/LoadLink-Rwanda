import { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { apiRequest } from '../api/http'
import type { ApiError } from '../api/http'

type Interest = {
  id: number
  plate_number: string
  truck_type: string
  declared_capacity: number
  rating_average: number | null
  company_name: string
  contact_person: string
}

const SELECTED_TRUCK_KEY = 'll_selected_truck_by_load'

export default function ShipperInterestedTrucks() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { getToken } = useAuth()

  const [interests, setInterests] = useState<Interest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState<Interest | null>(null)
  const [selecting, setSelecting] = useState(false)

  useEffect(() => {
    if (!id) return
    async function load() {
      try {
        const data = await apiRequest<Interest[]>(`/api/interests/shipment/${id}`, {
          token: getToken(),
        })
        setInterests(data)
      } catch (e) {
        setError((e as ApiError).message || 'Could not load interests.')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [id])

  async function confirmSelect(truck: Interest) {
    setSelecting(true)
    try {
      await apiRequest(`/api/shipments/${id}/select`, {
        method: 'PATCH',
        token: getToken(),
        body: { truck_id: truck.id },
      })
      // Store selected truck info for payment page
      localStorage.setItem(SELECTED_TRUCK_KEY, JSON.stringify({
        loadId: id,
        truckId: truck.id,
        companyName: truck.company_name,
        plate: truck.plate_number,
        type: truck.truck_type,
        capacity: truck.declared_capacity,
        rating: truck.rating_average ?? 0,
        phone: '',
        email: '',
      }))
      setPending(null)
      navigate(`/shipment/${id}/pay`)
    } catch (e) {
      setError((e as ApiError).message || 'Could not select truck.')
      setPending(null)
    } finally {
      setSelecting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-7 h-7 rounded-full border-2 border-sidebar border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 ll-animate-in">
      <div>
        <Link
          to="/loads"
          className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 text-stone-700 px-4 py-2 text-sm font-semibold hover:bg-stone-50 transition-colors"
        >
          ← Back to Shipments
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-stone-900">Interested Trucks</h1>
        <p className="text-sm text-stone-500 mt-0.5">Sorted by truck rating</p>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {interests.length === 0 && !error && (
        <div className="bg-white border border-stone-200 rounded-2xl p-10 text-center shadow-sm">
          <p className="text-stone-500 mb-2">No interested trucks yet.</p>
          <p className="text-sm text-stone-400">Companies need to express interest in your shipment first.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {interests.map((t) => (
          <div key={t.id} className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm flex flex-col">
            <h3 className="text-base font-bold text-stone-900 mb-3">{t.company_name}</h3>

            <p className="text-xs font-semibold text-amber-600 mb-1.5">Truck Rating</p>
            <div className="flex items-center gap-0.5 mb-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <svg
                  key={i}
                  className={`w-5 h-5 ${i <= Math.floor(t.rating_average ?? 0) ? 'text-amber-400' : 'text-stone-200'}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
              <span className="ml-1.5 text-sm font-semibold text-stone-700">
                {t.rating_average ? Number(t.rating_average).toFixed(1) : 'N/A'}
              </span>
            </div>

            <div className="space-y-2 text-sm border-t border-stone-100 pt-4">
              <div className="flex justify-between">
                <span className="text-stone-500">Plate:</span>
                <span className="font-semibold text-stone-900">{t.plate_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Type:</span>
                <span className="font-bold text-stone-900">{t.truck_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Capacity:</span>
                <span className="font-semibold text-stone-900">{t.declared_capacity} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Contact:</span>
                <span className="font-semibold text-stone-900">{t.contact_person}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setPending(t)}
              className="mt-4 w-full rounded-xl bg-amber-600 text-white py-3 font-semibold hover:bg-amber-700 transition-colors text-sm"
            >
              Select This Truck
            </button>
          </div>
        ))}
      </div>

      {/* Confirm modal */}
      {pending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full">
            <h2 className="text-lg font-bold text-stone-900">Confirm truck selection</h2>
            <p className="mt-2 text-sm text-stone-600">
              Select <span className="font-semibold">{pending.plate_number}</span> from{' '}
              <span className="font-semibold">{pending.company_name}</span>?
            </p>
            <p className="mt-2 text-xs text-stone-400">You will be taken to the escrow payment page.</p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => confirmSelect(pending)}
                disabled={selecting}
                className="flex-1 rounded-xl bg-sidebar text-white px-4 py-2.5 font-semibold hover:bg-stone-800 transition-colors disabled:opacity-60"
              >
                {selecting ? 'Selecting…' : 'Confirm'}
              </button>
              <button
                type="button"
                onClick={() => setPending(null)}
                className="flex-1 rounded-xl border border-stone-200 text-stone-700 px-4 py-2.5 font-semibold hover:bg-stone-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
