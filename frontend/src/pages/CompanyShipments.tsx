import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  getAvailableShipments,
  getMyTrucks,
  getMyInterestsList,
  expressInterest,
  type CompanyShipment,
  type CompanyTruck,
} from '../api/companyOpsApi'
import type { ApiError } from '../api/http'

export default function CompanyShipments() {
  const { user } = useAuth()
  const token = user?.token ?? ''
  const isVerified = String(user?.status ?? '').toUpperCase() === 'VERIFIED'

  const [shipments, setShipments] = useState<CompanyShipment[]>([])
  const [trucks, setTrucks] = useState<CompanyTruck[]>([])
  const [myInterestIds, setMyInterestIds] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  // Modal state
  const [offerShipment, setOfferShipment] = useState<CompanyShipment | null>(null)
  const [selectedTruckId, setSelectedTruckId] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [offerError, setOfferError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [s, t, i] = await Promise.all([
        getAvailableShipments(token),
        getMyTrucks(token),
        getMyInterestsList(token),
      ])
      setShipments(s)
      setTrucks(t)
      setMyInterestIds(new Set(i.map((x: any) => Number(x.shipment_id ?? x.shipmentId))))
    } catch (e) {
      setError((e as ApiError).message || 'Could not load shipments.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  const availableTrucks = trucks.filter(t => t.availability_status === 'AVAILABLE')

  async function handleExpressInterest(e: React.FormEvent) {
    e.preventDefault()
    if (!offerShipment?.id || !selectedTruckId) {
      setOfferError('Please select a truck.')
      return
    }
    setSubmitting(true)
    setOfferError(null)
    try {
      await expressInterest(token, {
        shipment_id: String(offerShipment.id),
        truck_id: selectedTruckId,
      })
      setMyInterestIds(prev => new Set([...prev, offerShipment.id!]))
      setOfferShipment(null)
      setSelectedTruckId('')
    } catch (e) {
      setOfferError((e as ApiError).message || 'Could not express interest.')
    } finally {
      setSubmitting(false)
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
    <div className="max-w-5xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Available shipments</h1>
          <p className="text-sm text-stone-600 mt-1">
            View open shipments and show interest using one of your trucks.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-600 hover:text-stone-900 hover:underline"
        >
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
          Refresh
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3 text-xs text-stone-600">
        <span className="inline-flex items-center gap-2 rounded-full bg-cream px-3 py-1 border border-stone-200">
          <span className="inline-block h-2 w-2 rounded-full bg-accent" />
          <span className="font-semibold text-stone-900">{shipments.length}</span>
          <span>load{shipments.length === 1 ? '' : 's'} available</span>
        </span>
        <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 border border-stone-200">
          <span className="inline-block h-2 w-2 rounded-full bg-sidebar" />
          <span className="font-semibold text-stone-900">{trucks.length}</span>
          <span>truck{trucks.length === 1 ? '' : 's'} in fleet</span>
        </span>
      </div>

      {!isVerified && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm font-semibold text-amber-900">Waiting for admin approval</p>
          <p className="text-sm text-amber-800 mt-1">
            Once your company is approved, you can show interest in shipments and add trucks.
          </p>
        </div>
      )}

      {error && (
        <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      {shipments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-10 text-center">
          <p className="text-stone-800 font-semibold">No shipments available</p>
          <p className="text-stone-600 text-sm mt-1">
            {trucks.length === 0
              ? 'Add a truck to your fleet to start seeing loads that match your capacity.'
              : 'Check back soon for new loads.'}
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {shipments.map((s) => {
            const id = s.id!
            const expressed = myInterestIds.has(id)
            const isExpanded = expandedId === id
            return (
              <li
                key={id}
                className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-stone-800 text-lg">
                        {s.pickup_district} → {s.dropoff_district}
                      </p>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-accent/10 text-accent border border-accent/20">
                        {Number(s.offered_price).toLocaleString()} RWF
                      </span>
                      {expressed && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-stone-100 text-stone-700 border border-stone-200">
                          Interest expressed
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-600">
                      <span>
                        Pickup date{' '}
                        <span className="font-semibold text-stone-800">
                          {new Date(s.pickup_date).toLocaleDateString()}
                        </span>
                      </span>
                      <span>
                        Weight{' '}
                        <span className="font-semibold text-stone-800">{s.weight} kg</span>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setExpandedId(prev => prev === id ? null : id)}
                      className="mt-3 text-sm font-semibold text-stone-700 hover:text-accent hover:underline underline-offset-2"
                    >
                      {isExpanded ? 'Hide details' : 'View details'}
                    </button>
                    {isExpanded && (
                      <div className="mt-4 rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm space-y-2">
                        <div className="flex justify-between gap-3">
                          <span className="text-stone-500">Pickup</span>
                          <span className="font-semibold text-stone-800">{s.pickup_district}</span>
                        </div>
                        <div className="flex justify-between gap-3">
                          <span className="text-stone-500">Dropoff</span>
                          <span className="font-semibold text-stone-800">{s.dropoff_district}</span>
                        </div>
                        <div className="flex justify-between gap-3">
                          <span className="text-stone-500">Pickup date</span>
                          <span className="font-semibold text-stone-800">{new Date(s.pickup_date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between gap-3">
                          <span className="text-stone-500">Price</span>
                          <span className="font-semibold text-stone-800">{Number(s.offered_price).toLocaleString()} RWF</span>
                        </div>
                        {s.cargo_description && (
                          <div className="pt-2">
                            <p className="text-stone-500 text-xs font-semibold uppercase tracking-wide">Cargo</p>
                            <p className="mt-1 text-stone-700">{s.cargo_description}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => { setOfferShipment(s); setSelectedTruckId(''); setOfferError(null) }}
                    disabled={expressed || !isVerified}
                    className="px-5 py-2.5 bg-accent text-white font-semibold rounded-xl hover:bg-accent-hover transition-colors shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {expressed ? 'Interest expressed' : 'Express interest'}
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {/* Express interest modal */}
      {offerShipment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm"
          onClick={() => setOfferShipment(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-stone-800">Show interest</h2>
            <p className="text-sm text-stone-600 mt-1">
              {offerShipment.pickup_district} → {offerShipment.dropoff_district} · {offerShipment.weight} kg
            </p>
            <div className="mt-4 rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-stone-500">Price</span>
                <span className="font-semibold text-accent">{Number(offerShipment.offered_price).toLocaleString()} RWF</span>
              </div>
              <div className="flex justify-between gap-3 mt-2">
                <span className="text-stone-500">Pickup date</span>
                <span className="font-semibold text-stone-800">{new Date(offerShipment.pickup_date).toLocaleDateString()}</span>
              </div>
            </div>
            <form onSubmit={handleExpressInterest} className="space-y-4 mt-4">
              <div>
                <label htmlFor="truck" className="block text-sm font-semibold text-stone-700 mb-2">
                  Choose a truck
                </label>
                <select
                  id="truck"
                  value={selectedTruckId}
                  onChange={e => setSelectedTruckId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 text-stone-800 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                >
                  <option value="">Select a truck…</option>
                  {availableTrucks.map(t => (
                    <option key={t.id} value={String(t.id)}>
                      {t.plate_number} · {t.declared_capacity} kg · {t.truck_type}
                    </option>
                  ))}
                </select>
                {availableTrucks.length === 0 && (
                  <p className="mt-2 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 border border-amber-200">
                    No available trucks. Add a truck or make one available first.
                  </p>
                )}
              </div>
              {offerError && (
                <p className="text-sm text-red-600">{offerError}</p>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting || !selectedTruckId}
                  className="px-5 py-2.5 bg-accent text-white font-semibold rounded-xl hover:bg-accent-hover disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting…' : 'Confirm'}
                </button>
                <button
                  type="button"
                  onClick={() => setOfferShipment(null)}
                  className="px-5 py-2.5 bg-stone-100 text-stone-700 font-semibold rounded-xl hover:bg-stone-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
