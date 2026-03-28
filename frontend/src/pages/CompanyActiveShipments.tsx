import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getAllLoads } from '../data/storage'
import { deliverShipment, getActiveShipments, getMyTrucks, pickupShipment, type CompanyShipment, type CompanyTruck } from '../api/companyOpsApi'
import type { ApiError } from '../api/http'
import { getApiToken } from '../auth/mockJwt'

type ShipStage =
  | 'POSTED'
  | 'AWAITING_ESCROW'
  | 'IN_TRANSIT'
  | 'AWAITING_CONFIRMATION'
  | 'COMPLETED'
  | 'DISPUTED'

type StatusGroup = 'ESCROW_FUNDED' | 'IN_TRANSIT' | 'AWAITING_CONFIRMATION'

const STAGES_KEY = 'll_shipper_stages'

function getStageMap(): Record<string, ShipStage> {
  try {
    return JSON.parse(localStorage.getItem(STAGES_KEY) ?? '{}') as Record<string, ShipStage>
  } catch {
    return {}
  }
}

function setStageForLoad(loadId: string, stage: ShipStage) {
  const map = getStageMap()
  map[loadId] = stage
  localStorage.setItem(STAGES_KEY, JSON.stringify(map))
}

const STATUS_LABELS: Record<StatusGroup, string> = {
  ESCROW_FUNDED: 'Payment received',
  IN_TRANSIT: 'On the way',
  AWAITING_CONFIRMATION: 'Waiting for confirmation',
}

const STATUS_DESCRIPTIONS: Record<StatusGroup, string> = {
  ESCROW_FUNDED: 'Ready for pickup.',
  IN_TRANSIT: 'In transit to destination.',
  AWAITING_CONFIRMATION: 'Waiting for the shipper to confirm delivery.',
}

const STATUS_COLORS: Record<StatusGroup, string> = {
  ESCROW_FUNDED: 'bg-cream text-sidebar border-stone-200',
  IN_TRANSIT: 'bg-accent/10 text-accent border-accent/20',
  AWAITING_CONFIRMATION: 'bg-amber-50 text-amber-800 border-amber-100',
}

export default function CompanyActiveShipments() {
  const { user } = useAuth()
  const companyName = user?.name ?? ''
  const rawToken = user?.token ?? null
  const apiToken = getApiToken(rawToken)
  const isVerified = String(user?.status ?? '').toUpperCase() === 'VERIFIED'
  const [refresh, setRefresh] = useState(0)
  const [apiShipments, setApiShipments] = useState<CompanyShipment[]>([])
  const [apiTrucks, setApiTrucks] = useState<CompanyTruck[]>([])
  const [state, setState] = useState<'idle' | 'loading' | 'error' | 'success'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [selectedTruckByShipment, setSelectedTruckByShipment] = useState<Record<string, string>>({})

  const grouped = useMemo(() => {
    if (apiToken) {
      const buckets: Record<StatusGroup, CompanyShipment[]> = {
        ESCROW_FUNDED: [],
        IN_TRANSIT: [],
        AWAITING_CONFIRMATION: [],
      }
      for (const s of apiShipments) {
        if (s.status === 'ESCROW_FUNDED') buckets.ESCROW_FUNDED.push(s)
        if (s.status === 'IN_TRANSIT') buckets.IN_TRANSIT.push(s)
        if (s.status === 'AWAITING_CONFIRMATION') buckets.AWAITING_CONFIRMATION.push(s)
      }
      return buckets as any
    }

    const stageMap = getStageMap()
    const all = getAllLoads()

    const buckets: Record<StatusGroup, typeof all> = {
      ESCROW_FUNDED: [],
      IN_TRANSIT: [],
      AWAITING_CONFIRMATION: [],
    }

    for (const load of all) {
      const hasOfferFromCompany = (load.offers ?? []).some((o) => o.companyName === companyName)
      if (!hasOfferFromCompany) continue

      const stage = stageMap[load.id]
      if (stage === 'AWAITING_ESCROW') buckets.ESCROW_FUNDED.push(load)
      if (stage === 'IN_TRANSIT') buckets.IN_TRANSIT.push(load)
      if (stage === 'AWAITING_CONFIRMATION') buckets.AWAITING_CONFIRMATION.push(load)
    }

    return buckets
  }, [companyName, refresh, apiToken, apiShipments])

  const counts = {
    ESCROW_FUNDED: grouped.ESCROW_FUNDED.length,
    IN_TRANSIT: grouped.IN_TRANSIT.length,
    AWAITING_CONFIRMATION: grouped.AWAITING_CONFIRMATION.length,
  }
  const totalActive = counts.ESCROW_FUNDED + counts.IN_TRANSIT + counts.AWAITING_CONFIRMATION

  const markPickup = (loadId: string) => {
    setStageForLoad(loadId, 'IN_TRANSIT')
    setRefresh((v) => v + 1)
  }

  const markDelivered = (loadId: string) => {
    setStageForLoad(loadId, 'AWAITING_CONFIRMATION')
    setRefresh((v) => v + 1)
  }

  useEffect(() => {
    const t = apiToken
    if (!t) return
    const tokenStr: string = t
    let cancelled = false
    async function load() {
      setState('loading')
      setError(null)
      try {
        const [shipments, trucks] = await Promise.all([getActiveShipments(tokenStr), getMyTrucks(tokenStr)])
        if (cancelled) return
        setApiShipments(shipments)
        setApiTrucks(trucks)
        setState('success')
      } catch (e) {
        if (cancelled) return
        const err = e as ApiError
        setError(err.message || 'Could not load active shipments.')
        setApiShipments([])
        setApiTrucks([])
        setState('error')
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [apiToken, refresh])

  async function apiMarkPickup(shipmentId: string) {
    const t = apiToken
    if (!t) return
    if (!isVerified) {
      setError('Your company is waiting for admin approval. You cannot update shipments yet.')
      return
    }
    setError(null)
    const truckId = selectedTruckByShipment[shipmentId]
    if (!truckId) {
      setError('Choose a truck before marking pickup.')
      return
    }
    try {
      await pickupShipment(t, shipmentId, truckId)
      setRefresh((v) => v + 1)
    } catch (e) {
      const err = e as ApiError
      setError(err.message || 'Could not mark pickup.')
    }
  }

  async function apiMarkDelivered(shipmentId: string) {
    const t = apiToken
    if (!t) return
    if (!isVerified) {
      setError('Your company is waiting for admin approval. You cannot update shipments yet.')
      return
    }
    setError(null)
    const truckId = selectedTruckByShipment[shipmentId]
    if (!truckId) {
      setError('Choose a truck before marking delivered.')
      return
    }
    try {
      await deliverShipment(t, shipmentId, truckId)
      setRefresh((v) => v + 1)
    } catch (e) {
      const err = e as ApiError
      setError(err.message || 'Could not mark delivered.')
    }
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Active shipments</h1>
          <p className="text-sm text-stone-600 mt-1">See shipments assigned to your trucks and update progress.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-2 rounded-full bg-cream px-3 py-1 border border-stone-200 text-stone-700">
            <span className="inline-block h-2 w-2 rounded-full bg-accent" />
            <span className="font-semibold text-stone-900">{totalActive}</span>
            <span>total</span>
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 border border-stone-200 text-stone-700">
            <span className="inline-block h-2 w-2 rounded-full bg-sidebar" />
            <span className="font-semibold text-stone-900">{counts.ESCROW_FUNDED}</span>
            <span>paid</span>
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 border border-stone-200 text-stone-700">
            <span className="inline-block h-2 w-2 rounded-full bg-accent" />
            <span className="font-semibold text-stone-900">{counts.IN_TRANSIT}</span>
            <span>in transit</span>
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 border border-stone-200 text-stone-700">
            <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
            <span className="font-semibold text-stone-900">{counts.AWAITING_CONFIRMATION}</span>
            <span>awaiting</span>
          </span>
        </div>
      </div>

      {error && (
        <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      {apiToken && state === 'loading' && (
        <p className="text-stone-500 text-sm mb-4">Loading active shipments…</p>
      )}

      {rawToken && !isVerified && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm font-semibold text-amber-900">Waiting for admin approval</p>
          <p className="text-sm text-amber-800 mt-1">
            After your company is approved, you can mark pickup and delivery.
          </p>
        </div>
      )}

      <div className="space-y-6">
        {(Object.keys(STATUS_LABELS) as StatusGroup[]).map((status) => {
          const shipments = grouped[status]
          return (
            <section key={status} className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
              <header className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-sm font-semibold text-stone-800">{STATUS_LABELS[status]}</h2>
                  <p className="text-xs text-stone-500">{STATUS_DESCRIPTIONS[status]}</p>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${STATUS_COLORS[status]}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {shipments.length} shipment{shipments.length === 1 ? '' : 's'}
                </span>
              </header>

              {shipments.length === 0 ? (
                <p className="text-sm text-stone-500">No shipments in this status yet.</p>
              ) : (
                <ul className="space-y-3">
                  {shipments.map((load: any) => (
                    <li
                      key={load.id}
                      className="rounded-2xl border border-stone-200 bg-sand px-4 py-3 flex items-start justify-between gap-4"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-stone-800 text-sm">
                          {apiToken
                            ? `${load.pickupDistrict ?? load.pickup_district ?? '—'} → ${load.dropoffDistrict ?? load.dropoff_district ?? '—'}`
                            : `${load.origin} → ${load.destination}`}
                        </p>
                        <p className="text-xs text-stone-500 mt-1">
                          {apiToken
                            ? `${load.weightTons ?? load.weight_tons ?? '—'} tons · ID ${load.id}`
                            : `${new Date(load.date).toLocaleDateString()} · ${load.weight}`}
                        </p>
                        {apiToken && (
                          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[12px] text-stone-600">
                            <div className="rounded-xl border border-stone-200 bg-white px-3 py-2">
                              <p className="text-[11px] font-semibold text-stone-500">Shipper contact</p>
                              <p className="mt-1 text-stone-800 font-semibold">{load.shipperName ?? load.shipper_name ?? '—'}</p>
                              <p className="text-stone-600">{load.shipperPhone ?? load.shipper_phone ?? '—'}</p>
                              <p className="text-stone-600">{load.shipperEmail ?? load.shipper_email ?? '—'}</p>
                            </div>
                            <div className="rounded-xl border border-stone-200 bg-white px-3 py-2">
                              <p className="text-[11px] font-semibold text-stone-500">Truck</p>
                              <p className="mt-1 text-stone-800 font-semibold">
                                {load.truckPlate ?? load.truck_plate ?? 'Choose below'}
                              </p>
                              <p className="text-stone-600">
                                Company: {load.companyName ?? load.company_name ?? user?.name ?? '—'}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="text-right shrink-0 flex flex-col items-end gap-2">
                        {apiToken && (status === 'ESCROW_FUNDED' || status === 'IN_TRANSIT') ? (
                          <select
                            className="w-[220px] px-3 py-2 rounded-xl bg-white border border-stone-200 text-sm text-stone-800 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                            value={selectedTruckByShipment[load.id] ?? ''}
                            onChange={(e) =>
                              setSelectedTruckByShipment((prev) => ({ ...prev, [load.id]: e.target.value }))
                            }
                          >
                            <option value="">Choose a truck…</option>
                            {apiTrucks.map((t) => (
                              <option key={t.id} value={t.id}>
                                {(t.plate_number ?? t.plateNumber ?? 'Plate')} · {(t.availability_status ?? t.availabilityStatus ?? 'AVAILABLE')}
                              </option>
                            ))}
                          </select>
                        ) : null}

                        {status === 'ESCROW_FUNDED' ? (
                          <button
                            type="button"
                            onClick={() => (apiToken ? void apiMarkPickup(load.id) : markPickup(load.id))}
                            className="inline-flex items-center justify-center px-4 py-2 rounded-2xl bg-accent text-sidebar font-semibold hover:bg-accent-hover transition-colors"
                          >
                            Mark pickup
                          </button>
                        ) : null}
                        {status === 'IN_TRANSIT' ? (
                          <button
                            type="button"
                            onClick={() => (apiToken ? void apiMarkDelivered(load.id) : markDelivered(load.id))}
                            className="inline-flex items-center justify-center px-4 py-2 rounded-2xl bg-sidebar text-white font-semibold hover:bg-sidebar-hover transition-colors"
                          >
                            Mark delivered
                          </button>
                        ) : null}
                        {status === 'AWAITING_CONFIRMATION' ? (
                          <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 text-amber-800 border border-amber-100 px-3 py-1 text-xs font-semibold">
                            Awaiting shipper confirmation
                          </span>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )
        })}
      </div>
    </div>
  )
}

