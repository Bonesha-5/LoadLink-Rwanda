import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  getAllLoads,
  addOfferToLoad,
  ensureSeedLoads,
  getTrucksByCompany,
} from '../data/storage'
import { expressInterest, getAvailableShipments, getMyTrucks, type CompanyShipment, type CompanyTruck } from '../api/companyOpsApi'
import type { ApiError } from '../api/http'
import { getMyInterestsList, type CompanyInterest } from '../api/companyOpsApi'
import { getApiToken } from '../auth/mockJwt'

export default function CompanyShipments() {
  const { user } = useAuth()
  const companyName = user?.name ?? ''
  const rawToken = user?.token ?? null
  const apiToken = getApiToken(rawToken)
  const isVerified = String(user?.status ?? '').toUpperCase() === 'VERIFIED'
  const [refresh, setRefresh] = useState(0)
  const [offerLoadId, setOfferLoadId] = useState<string | null>(null)
  const [offerMessage, setOfferMessage] = useState('')
  const [selectedTruckId, setSelectedTruckId] = useState<string>('')
  const [apiShipments, setApiShipments] = useState<CompanyShipment[]>([])
  const [apiTrucks, setApiTrucks] = useState<CompanyTruck[]>([])
  const [apiInterests, setApiInterests] = useState<CompanyInterest[]>([])
  const [state, setState] = useState<'idle' | 'loading' | 'error' | 'success'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const formatRwf = (value: unknown): string => {
    if (typeof value === 'number' && Number.isFinite(value)) return `${value.toLocaleString()} RWF`
    if (typeof value === 'string' && value.trim()) return value.trim()
    return 'Price not set'
  }

  const loads = useMemo(() => {
    void refresh
    if (apiToken) return [] as any[]
    ensureSeedLoads()
    const allOpen = getAllLoads().filter((l) => l.status === 'open')
    const trucks = getTrucksByCompany(companyName)

    // If company has no trucks yet, show nothing but the hint in the UI.
    if (!trucks.length) return [] as typeof allOpen

    const parseTons = (value: string | undefined): number | null => {
      if (!value) return null
      // Expect strings like "5 tons", "12 t", or "8"
      const match = value.match(/(\d+(\.\d+)?)/)
      if (!match) return null
      return Number(match[1])
    }

    const capacities = trucks
      .map((t) => parseTons(t.capacity))
      .filter((v): v is number => typeof v === 'number')

    if (!capacities.length) return [] as typeof allOpen

    const maxCapacity = Math.max(...capacities)

    return allOpen.filter((load) => {
      const weightTons = parseTons(load.weight)
      if (weightTons == null) return true
      return weightTons <= maxCapacity
    })
  }, [refresh, companyName, apiToken])

  const fleetCount = useMemo(() => {
    void refresh
    if (apiToken) return apiTrucks.length
    return getTrucksByCompany(companyName).length
  }, [companyName, refresh, apiToken, apiTrucks.length])

  useEffect(() => {
    const t = apiToken
    if (!t) return
    const tokenStr: string = t
    let cancelled = false
    async function load() {
      setState('loading')
      setError(null)
      try {
        const [shipments, trucks, interests] = await Promise.all([
          getAvailableShipments(tokenStr),
          getMyTrucks(tokenStr),
          getMyInterestsList(tokenStr),
        ])
        if (cancelled) return
        setApiShipments(shipments)
        setApiTrucks(trucks)
        setApiInterests(interests)
        setState('success')
      } catch (e) {
        if (cancelled) return
        const err = e as ApiError
        setError(err.message || 'Could not load available shipments.')
        setApiShipments([])
        setApiTrucks([])
        setApiInterests([])
        setState('error')
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [apiToken, refresh])

  const myInterestShipmentIds = useMemo(() => {
    const set = new Set<string>()
    for (const i of apiInterests) {
      const id = String(i.shipmentId ?? i.shipment_id ?? '')
      if (id) set.add(id)
    }
    return set
  }, [apiInterests])

  const availableApiTrucks = useMemo(() => {
    return apiTrucks.filter((t) => (t.availability_status ?? t.availabilityStatus ?? 'AVAILABLE') === 'AVAILABLE')
  }, [apiTrucks])

  const capacityMax = useMemo(() => {
    const caps = availableApiTrucks
      .map((t) => t.declared_capacity ?? t.declaredCapacity ?? null)
      .filter((v): v is number => typeof v === 'number' && Number.isFinite(v))
    return caps.length ? Math.max(...caps) : null
  }, [availableApiTrucks])

  const filteredApiShipments = useMemo(() => {
    // filter open shipments to match max available capacity (simple and understandable)
    if (!apiToken) return [] as CompanyShipment[]
    if (capacityMax == null) return apiShipments
    return apiShipments.filter((s) => {
      const w = s.weightTons ?? s.weight_tons
      if (typeof w !== 'number') return true
      return w <= capacityMax
    })
  }, [apiShipments, capacityMax, apiToken])

  function openOfferModal(loadId: string) {
    setOfferLoadId(loadId)
    setOfferMessage('')
    setSelectedTruckId('')
  }

  function closeOfferModal() {
    setOfferLoadId(null)
    setOfferMessage('')
    setSelectedTruckId('')
  }

  async function handleSubmitOffer(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (apiToken) {
      const t = apiToken
      if (!isVerified) {
        setError('Your company is waiting for admin approval. You cannot accept shipments yet.')
        return
      }
      if (!offerLoadId) return
      if (myInterestShipmentIds.has(String(offerLoadId))) {
        setError('You already showed interest in this shipment.')
        return
      }
      if (!selectedTruckId) {
        setError('Please choose a truck for this shipment.')
        return
      }
      try {
        await expressInterest(t, { shipment_id: offerLoadId, truck_id: selectedTruckId })
        closeOfferModal()
        setRefresh((v) => v + 1)
      } catch (e) {
        const err = e as ApiError
        setError(err.message || 'Could not express interest.')
      }
      return
    }

    if (!offerLoadId || !offerLoad) return
    const amount = offerLoad.price ?? 'ACCEPTED'
    addOfferToLoad(offerLoadId, companyName, amount, offerMessage.trim() || undefined)
    closeOfferModal()
    setRefresh((v) => v + 1)
  }

  const offerLoad = offerLoadId ? loads.find((l) => l.id === offerLoadId) : null
  const offerShipment = offerLoadId ? filteredApiShipments.find((s) => String(s.id) === String(offerLoadId)) : null

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
          onClick={() => setRefresh((v) => v + 1)}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-600 hover:text-stone-900 hover:underline"
        >
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
          Refresh
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3 text-xs text-stone-600">
        <span className="inline-flex items-center gap-2 rounded-full bg-cream px-3 py-1 border border-stone-200">
          <span className="inline-block h-2 w-2 rounded-full bg-accent" />
          <span className="font-semibold text-stone-900">{loads.length}</span>
          <span>load{loads.length === 1 ? '' : 's'} available</span>
        </span>
        <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 border border-stone-200">
          <span className="inline-block h-2 w-2 rounded-full bg-sidebar" />
          <span className="font-semibold text-stone-900">{fleetCount}</span>
          <span>truck{fleetCount === 1 ? '' : 's'} in fleet</span>
        </span>
        <span className="hidden sm:inline text-stone-500">
          Add at least one truck first to express interest.
        </span>
      </div>

      {error && (
        <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      {rawToken && !isVerified && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm font-semibold text-amber-900">Waiting for admin approval</p>
          <p className="text-sm text-amber-800 mt-1">
            Once your company is approved, you can show interest in shipments and add trucks.
          </p>
        </div>
      )}

      {apiToken && state === 'loading' ? (
        <p className="text-stone-500 text-sm">Loading shipments…</p>
      ) : null}

      {(apiToken ? apiShipments.length === 0 : loads.length === 0) ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-10 text-center">
          <p className="text-stone-800 font-semibold">No shipments available</p>
          <p className="text-stone-600 text-sm mt-1">
            {fleetCount === 0
              ? 'Add a truck to your fleet to start seeing loads that match your capacity.'
              : 'Check back soon for new loads.'}
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {(apiToken ? filteredApiShipments : loads).map((load: any) => {
            const id = String(load.id)
            const expressed = apiToken ? myInterestShipmentIds.has(id) : false
            const isExpanded = expandedId === id
            return (
            <li
              key={load.id}
              className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold text-stone-800 text-lg">
                      {(load.origin ?? load.pickupDistrict ?? load.pickup_district ?? '—')} →{' '}
                      {(load.destination ?? load.dropoffDistrict ?? load.dropoff_district ?? '—')}
                    </p>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-accent/10 text-accent border border-accent/20">
                      {apiToken ? formatRwf(load.offeredPriceRwf ?? load.offered_price_rwf) : formatRwf(load.price)}
                    </span>
                    {expressed && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-stone-100 text-stone-700 border border-stone-200">
                        Interest expressed
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-600">
                    <span>
                      Date{' '}
                      <span className="font-semibold text-stone-800">
                        {new Date(load.date ?? load.createdAt ?? load.created_at ?? Date.now()).toLocaleDateString()}
                      </span>
                    </span>
                    <span>
                      Weight{' '}
                      <span className="font-semibold text-stone-800">
                        {apiToken ? `${load.weightTons ?? load.weight_tons ?? '—'} tons` : load.weight}
                      </span>
                    </span>
                    {!apiToken && (
                      <span className="text-stone-500">
                        Shipper <span className="font-semibold text-stone-700">{load.createdBy}</span>
                      </span>
                    )}
                    <span className="text-stone-500">
                      {apiToken ? (
                        <span className="font-semibold text-stone-700">{formatStatusLabel(load.status)}</span>
                      ) : (
                        <>
                          Offers <span className="font-semibold text-stone-700">{load.offers?.length ?? 0}</span>
                        </>
                      )}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setExpandedId((prev) => (prev === id ? null : id))}
                    className="mt-3 text-sm font-semibold text-stone-700 hover:text-accent hover:underline underline-offset-2"
                  >
                    {isExpanded ? 'Hide details' : 'View details'}
                  </button>
                  {isExpanded && (
                    <div className="mt-4 rounded-2xl border border-stone-200 bg-sand p-4 text-sm text-stone-700 space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-stone-500">Pickup district</span>
                        <span className="font-semibold text-stone-800">{load.pickupDistrict ?? load.pickup_district ?? load.origin ?? '—'}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-stone-500">Dropoff district</span>
                        <span className="font-semibold text-stone-800">{load.dropoffDistrict ?? load.dropoff_district ?? load.destination ?? '—'}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-stone-500">Pickup date</span>
                        <span className="font-semibold text-stone-800">{new Date(load.date ?? load.createdAt ?? load.created_at ?? Date.now()).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-stone-500">Offered price</span>
                        <span className="font-semibold text-stone-800">
                          {apiToken ? `${(load.offeredPriceRwf ?? load.offered_price_rwf ?? 0).toLocaleString()} RWF` : (load.price ?? '—')}
                        </span>
                      </div>
                      <div className="pt-2">
                        <p className="text-stone-500 text-xs font-semibold uppercase tracking-wide">Cargo</p>
                        <p className="mt-1 text-stone-700">
                          {load.description ?? 'Cargo details not provided.'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => openOfferModal(load.id)}
                  disabled={expressed || (apiToken ? !isVerified : false)}
                  className="px-5 py-2.5 bg-accent text-white font-semibold rounded-xl hover:bg-accent-hover transition-colors shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {expressed ? 'Interest expressed' : 'Express interest'}
                </button>
              </div>
            </li>
            )})}
        </ul>
      )}

      {(apiToken ? offerShipment : offerLoad) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm"
          onClick={closeOfferModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="offer-modal-title"
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="offer-modal-title" className="text-lg font-bold text-stone-800">
              Show interest
            </h2>
            <p className="text-sm text-stone-600 mt-1">
              {apiToken
                ? `${offerShipment?.pickupDistrict ?? offerShipment?.pickup_district ?? '—'} → ${offerShipment?.dropoffDistrict ?? offerShipment?.dropoff_district ?? '—'} · ${offerShipment?.weightTons ?? offerShipment?.weight_tons ?? '—'} tons`
                : `${offerLoad?.origin} → ${offerLoad?.destination} · ${offerLoad?.weight}`}
            </p>
            <div className="mt-4 rounded-2xl border border-stone-200 bg-sand p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-stone-500">Price</p>
                <p className="text-sm font-semibold text-accent">
                  {apiToken
                    ? formatRwf(offerShipment?.offeredPriceRwf ?? offerShipment?.offered_price_rwf)
                    : formatRwf(offerLoad?.price)}
                </p>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="text-xs text-stone-500">{apiToken ? 'Status' : 'Pickup date'}</p>
                <p className="text-xs font-semibold text-stone-800">
                  {apiToken
                    ? formatStatusLabel(offerShipment?.status ?? 'POSTED')
                    : new Date(offerLoad?.date ?? Date.now()).toLocaleDateString()}
                </p>
              </div>
            </div>
            <form onSubmit={handleSubmitOffer} className="space-y-4">
              {apiToken && (
                <div>
                  <label htmlFor="truck" className="block text-sm font-semibold text-stone-700 mb-2">
                    Choose a truck
                  </label>
                  <select
                    id="truck"
                    value={selectedTruckId}
                    onChange={(e) => setSelectedTruckId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 text-stone-800 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                  >
                    <option value="">Select a truck…</option>
                    {availableApiTrucks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {(t.plate_number ?? t.plateNumber ?? 'Plate')} · {(t.declared_capacity ?? t.declaredCapacity ?? '—')}t · {(t.availability_status ?? t.availabilityStatus ?? 'AVAILABLE')}
                      </option>
                    ))}
                  </select>
                  {availableApiTrucks.length === 0 && (
                    <p className="mt-2 text-xs text-stone-500">No AVAILABLE trucks yet. Add a truck or switch one to Available.</p>
                  )}
                </div>
              )}
              <div>
                <label htmlFor="offer-message" className="block text-sm font-semibold text-stone-700 mb-2">
                  Message to shipper (optional)
                </label>
                <textarea
                  id="offer-message"
                  rows={2}
                  placeholder="e.g. Available from Monday"
                  value={offerMessage}
                  onChange={(e) => setOfferMessage(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-accent text-white font-semibold rounded-xl hover:bg-accent-hover"
                >
                  Confirm
                </button>
                <button type="button" onClick={closeOfferModal} className="px-5 py-2.5 bg-stone-100 text-stone-700 font-semibold rounded-xl hover:bg-stone-200">
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
