import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  getTrucksByCompany,
  addTruck as addTruckStorage,
  deleteTruck as deleteTruckStorage,
  getTruckRatingAverage,
  getRatingsByTruck,
} from '../data/storage'
import { getMyTrucks, registerTruck, updateTruckStatus, type CompanyTruck } from '../api/companyOpsApi'
import type { ApiError } from '../api/http'
import { getApiToken } from '../auth/mockJwt'

export default function CompanyTrucks() {
  const { user } = useAuth()
  const companyName = user?.name ?? ''
  const rawToken = user?.token ?? null
  const apiToken = getApiToken(rawToken)
  const isVerified = String(user?.status ?? '').toUpperCase() === 'VERIFIED'
  const [refresh, setRefresh] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [capacity, setCapacity] = useState('')
  const [location, setLocation] = useState('')
  const [plateNumber, setPlateNumber] = useState('')
  const [truckType, setTruckType] = useState('Flatbed')
  const [availability, setAvailability] = useState<'AVAILABLE' | 'RESERVED' | 'IN_TRANSIT' | 'UNAVAILABLE'>('AVAILABLE')
  const [insuranceCertFile, setInsuranceCertFile] = useState<File | null>(null)
  const [apiTrucks, setApiTrucks] = useState<CompanyTruck[]>([])
  const [state, setState] = useState<'idle' | 'loading' | 'error' | 'success'>('idle')
  const [error, setError] = useState<string | null>(null)

  const trucks = useMemo(() => {
    void refresh
    if (apiToken) return [] // API-backed
    return getTrucksByCompany(companyName)
  }, [companyName, refresh, apiToken])

  useEffect(() => {
    const t = apiToken
    if (!t) return
    const tokenStr: string = t
    let cancelled = false
    async function load() {
      setState('loading')
      setError(null)
      try {
        const data = await getMyTrucks(tokenStr)
        if (cancelled) return
        setApiTrucks(data)
        setState('success')
      } catch (e) {
        if (cancelled) return
        const err = e as ApiError
        setError(err.message || 'Could not load your trucks.')
        setApiTrucks([])
        setState('error')
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [apiToken, refresh])

  const ratingsByTruck = useMemo(() => {
    void refresh
    const map = new Map<string, { avg: number | null; count: number }>()
    ;(apiToken ? [] : trucks).forEach((t) => {
      const avg = getTruckRatingAverage(t.id)
      const count = getRatingsByTruck(t.id).length
      map.set(t.id, { avg, count })
    })
    return map
  }, [trucks, refresh, apiToken])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!capacity.trim() || !location.trim()) return
    setError(null)
    if (apiToken) {
      if (!isVerified) {
        setError('Your company is waiting for admin approval. You cannot add trucks yet.')
        return
      }
      try {
        await registerTruck(apiToken, {
          plate_number: plateNumber.trim() || `RAB-${Math.floor(Math.random() * 900 + 100)}-A`,
          truck_type: truckType,
          declared_capacity: Number(capacity),
          reg_card_path: 'uploaded/placeholder.pdf',
          insurance_cert_path: insuranceCertFile?.name ?? '',
        })
        setCapacity('')
        setLocation('')
        setPlateNumber('')
        setTruckType('Flatbed')
        setAvailability('AVAILABLE')
        setInsuranceCertFile(null)
        setShowForm(false)
        setRefresh((v) => v + 1)
      } catch (e) {
        const err = e as ApiError
        setError(err.message || 'Could not add this truck.')
      }
      return
    }

    addTruckStorage({
      companyName,
      capacity: capacity.trim(),
      location: location.trim(),
      plateNumber: plateNumber.trim() || undefined,
    })
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

  async function setApiTruckStatus(id: string, next: 'AVAILABLE' | 'RESERVED' | 'IN_TRANSIT' | 'UNAVAILABLE') {
    const t = apiToken
    if (!t) return
    setError(null)
    try {
      await updateTruckStatus(t, id, next)
      setRefresh((v) => v + 1)
    } catch (e) {
      const err = e as ApiError
      setError(err.message || 'Could not update truck status.')
    }
  }

  function renderStars(avg: number): string {
    const rounded = Math.round(avg)
    return '★★★★★'.slice(0, rounded) + '☆☆☆☆☆'.slice(0, 5 - rounded)
  }

  return (
    <div className="max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">My trucks</h1>
          <p className="text-stone-600 mt-1">
            Add and manage your trucks. You’ll use them when you show interest in shipments.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          disabled={apiToken ? !isVerified : false}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-white font-semibold rounded-xl hover:bg-accent-hover transition-all shadow-lg shadow-accent/20 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8v8m-8-8H4" />
          </svg>
          Add truck
        </button>
      </div>

      {rawToken && !isVerified && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm font-semibold text-amber-900">Waiting for admin approval</p>
          <p className="text-sm text-amber-800 mt-1">
            Your company must be approved before you can add trucks or accept shipments.
          </p>
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-lg p-6 mb-8">
          <h2 className="text-lg font-bold text-stone-800 mb-4">Add a truck</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {apiToken && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="truckType" className="block text-sm font-semibold text-stone-700 mb-2">Truck type</label>
                  <input
                    id="truckType"
                    type="text"
                    placeholder="e.g. Flatbed"
                    value={truckType}
                    onChange={(e) => setTruckType(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </div>
                <div>
                  <label htmlFor="availability" className="block text-sm font-semibold text-stone-700 mb-2">Availability</label>
                  <select
                    id="availability"
                    value={availability}
                    onChange={(e) => setAvailability(e.target.value as any)}
                    className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 text-stone-800 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="RESERVED">Reserved</option>
                    <option value="IN_TRANSIT">In transit</option>
                    <option value="UNAVAILABLE">Unavailable</option>
                  </select>
                </div>
              </div>
            )}
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
            <div>
              <label htmlFor="insuranceCert" className="block text-sm font-semibold text-stone-700 mb-2">
                Insurance certificate <span className="text-red-500">*</span>
              </label>
              <label
                htmlFor="insuranceCert"
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 text-stone-800 cursor-pointer hover:bg-stone-100 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 transition-all"
              >
                <svg className="w-4 h-4 text-stone-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span className={`text-sm truncate ${insuranceCertFile ? 'text-stone-800' : 'text-stone-400'}`}>
                  {insuranceCertFile ? insuranceCertFile.name : 'Upload insurance certificate (PDF or image)'}
                </span>
                <input
                  id="insuranceCert"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="sr-only"
                  onChange={(e) => setInsuranceCertFile(e.target.files?.[0] ?? null)}
                />
              </label>
              <p className="text-xs text-stone-400 mt-1.5">
                This truck will be pending admin verification before it can be used for shipments.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 bg-accent text-white font-semibold rounded-xl hover:bg-accent-hover"
              >
                Submit for verification
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setCapacity(''); setLocation(''); setPlateNumber(''); setInsuranceCertFile(null) }}
                className="px-5 py-2.5 bg-stone-100 text-stone-700 font-semibold rounded-xl hover:bg-stone-200"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {error && (
        <p className="mb-6 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      {apiToken && state === 'loading' && !showForm ? (
        <p className="text-stone-500 text-sm">Loading your trucks…</p>
      ) : null}

      {((apiToken ? apiTrucks.length : trucks.length) === 0) && !showForm ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-10 text-center">
          <p className="text-stone-600 mb-4">
            You haven&apos;t added any trucks yet. Add at least one truck to start bidding on loads.
          </p>
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
          {(apiToken ? apiTrucks : trucks).map((truck: any) => (
            <li
              key={truck.id}
              className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start gap-2">
                <div>
                  <p className="font-semibold text-stone-800">
                    {apiToken ? `${truck.declared_capacity ?? truck.declaredCapacity ?? '—'} tons` : `${truck.capacity} tons`}
                  </p>
                  <p className="text-stone-600 text-sm mt-1">
                    {apiToken ? `Type: ${truck.truck_type ?? truck.truckType ?? '—'}` : `Location: ${truck.location}`}
                  </p>
                  <p className="text-stone-500 text-sm">
                    Plate: {apiToken ? (truck.plate_number ?? truck.plateNumber ?? '—') : (truck.plateNumber ?? '—')}
                  </p>
                  {apiToken && (() => {
                    const vs = truck.verification_status ?? truck.verificationStatus ?? 'PENDING'
                    const vsMap: Record<string, { label: string; cls: string }> = {
                      PENDING:  { label: 'Pending verification', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
                      VERIFIED: { label: 'Verified',             cls: 'bg-green-50 text-green-700 border-green-200' },
                      REJECTED: { label: 'Rejected',             cls: 'bg-red-50 text-red-700 border-red-200' },
                    }
                    const info = vsMap[vs] ?? vsMap.PENDING
                    return (
                      <span className={`mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${info.cls}`}>
                        {info.label}
                      </span>
                    )
                  })()}
                  {apiToken && (
                    <div className="mt-3">
                      <p className="text-xs font-semibold text-stone-600">Availability</p>
                      {(() => {
                        const status = (truck.availability_status ?? truck.availabilityStatus ?? 'AVAILABLE') as
                          | 'AVAILABLE'
                          | 'RESERVED'
                          | 'IN_TRANSIT'
                          | 'UNAVAILABLE'

                        if (status === 'RESERVED' || status === 'IN_TRANSIT') {
                          return (
                            <span className="mt-1 inline-flex items-center rounded-full bg-stone-100 text-stone-700 border border-stone-200 px-3 py-1 text-xs font-semibold">
                              {status === 'RESERVED' ? 'Reserved' : 'In transit'}
                            </span>
                          )
                        }

                        return (
                          <div className="mt-2 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => void setApiTruckStatus(truck.id, 'AVAILABLE')}
                              disabled={status === 'AVAILABLE'}
                              className="px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors disabled:opacity-60 disabled:cursor-not-allowed bg-white border-stone-200 text-stone-700 hover:border-stone-300"
                            >
                              Available
                            </button>
                            <button
                              type="button"
                              onClick={() => void setApiTruckStatus(truck.id, 'UNAVAILABLE')}
                              disabled={status === 'UNAVAILABLE'}
                              className="px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors disabled:opacity-60 disabled:cursor-not-allowed bg-white border-stone-200 text-stone-700 hover:border-stone-300"
                            >
                              Unavailable
                            </button>
                          </div>
                        )
                      })()}
                    </div>
                  )}
                  <div className="mt-3">
                    {(() => {
                      const info = ratingsByTruck.get(truck.id)
                      const avg = info?.avg ?? null
                      const count = info?.count ?? 0
                      if (!count || avg == null) {
                        return (
                          <span className="inline-flex items-center gap-2 rounded-full bg-stone-100 text-stone-700 px-3 py-1 text-xs font-semibold border border-stone-200">
                            <span className="text-stone-500">★</span>
                            No ratings yet
                          </span>
                        )
                      }
                      return (
                        <span className="inline-flex items-center gap-2 rounded-full bg-cream text-sidebar px-3 py-1 text-xs font-semibold border border-stone-200">
                          <span className="text-accent">{renderStars(avg)}</span>
                          <span className="text-stone-700 font-semibold">{avg.toFixed(1)}</span>
                          <span className="text-stone-500 font-medium">({count})</span>
                        </span>
                      )
                    })()}
                  </div>
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
