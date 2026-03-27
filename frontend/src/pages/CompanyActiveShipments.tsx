import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  getCompanyActiveDemoShipments,
  updateCompanyDemoShipmentStatus,
  ensureSeedCompanyData,
} from '../data/storage'
import {
  deliverShipment,
  getActiveShipments,
  getMyTrucks,
  pickupShipment,
  type CompanyShipment,
  type CompanyTruck,
} from '../api/companyOpsApi'
import type { ApiError } from '../api/http'
import { getApiToken } from '../auth/mockJwt'

// ── Types ─────────────────────────────────────────────────────
type AllStatus = 'AWAITING_ESCROW' | 'ESCROW_FUNDED' | 'IN_TRANSIT' | 'AWAITING_CONFIRMATION' | 'COMPLETED'
type Filter    = 'ALL' | 'AWAITING_ESCROW' | 'ESCROW_FUNDED' | 'AWAITING_CONFIRMATION' | 'COMPLETED'

type Shipment = {
  id: string
  pickup: string
  dropoff: string
  weight: number
  price: number
  status: AllStatus
  shipperName: string
  shipperPhone: string | null
  truckPlate: string | null
  createdAt?: string
}

// ── Status config — one source of truth for colors ────────────
type StatusConfig = {
  label: string
  cardBorder: string
  cardBg: string
  badgeBg: string
  badgeText: string
  dot: string
  // tab colors when active
  tabBg: string
  tabText: string
  tabBorder: string
  // action button
  btnBg: string
  btnText: string
  btnHover: string
}

const STATUS: Record<AllStatus, StatusConfig> = {
  AWAITING_ESCROW: {
    label:      'Interest Expressed',
    cardBorder: 'border-red-300',
    cardBg:     'bg-red-50',
    badgeBg:    'bg-red-100',
    badgeText:  'text-red-700',
    dot:        'bg-red-500',
    tabBg:      'bg-red-500',
    tabText:    'text-white',
    tabBorder:  'border-red-500',
    btnBg:      'bg-red-100',
    btnText:    'text-red-700',
    btnHover:   'hover:bg-red-200',
  },
  ESCROW_FUNDED: {
    label:      'Ready for Pickup',
    cardBorder: 'border-green-300',
    cardBg:     'bg-green-50',
    badgeBg:    'bg-green-100',
    badgeText:  'text-green-700',
    dot:        'bg-green-500',
    tabBg:      'bg-green-600',
    tabText:    'text-white',
    tabBorder:  'border-green-600',
    btnBg:      'bg-green-600',
    btnText:    'text-white',
    btnHover:   'hover:bg-green-700',
  },
  IN_TRANSIT: {
    label:      'In Transit',
    cardBorder: 'border-accent/40',
    cardBg:     'bg-accent/5',
    badgeBg:    'bg-accent/10',
    badgeText:  'text-sidebar',
    dot:        'bg-accent',
    tabBg:      'bg-sidebar',
    tabText:    'text-white',
    tabBorder:  'border-sidebar',
    btnBg:      'bg-sidebar',
    btnText:    'text-white',
    btnHover:   'hover:bg-stone-800',
  },
  AWAITING_CONFIRMATION: {
    label:      'Awaiting Confirmation',
    cardBorder: 'border-orange-300',
    cardBg:     'bg-orange-50',
    badgeBg:    'bg-orange-100',
    badgeText:  'text-orange-700',
    dot:        'bg-orange-500',
    tabBg:      'bg-orange-500',
    tabText:    'text-white',
    tabBorder:  'border-orange-500',
    btnBg:      'bg-orange-500',
    btnText:    'text-white',
    btnHover:   'hover:bg-orange-600',
  },
  COMPLETED: {
    label:      'Completed',
    cardBorder: 'border-stone-200',
    cardBg:     'bg-white',
    badgeBg:    'bg-stone-100',
    badgeText:  'text-stone-500',
    dot:        'bg-stone-400',
    tabBg:      'bg-stone-700',
    tabText:    'text-white',
    tabBorder:  'border-stone-700',
    btnBg:      '',
    btnText:    '',
    btnHover:   '',
  },
}

// ── Filters ───────────────────────────────────────────────────
const FILTERS: { value: Filter; label: string }[] = [
  { value: 'ALL',                   label: 'All' },
  { value: 'AWAITING_ESCROW',       label: 'Interest Expressed' },
  { value: 'ESCROW_FUNDED',         label: 'Ready for Pickup' },
  { value: 'AWAITING_CONFIRMATION', label: 'Awaiting Confirmation' },
  { value: 'COMPLETED',             label: 'History' },
]

type ModalState = {
  shipmentId: string
  action: 'pickup' | 'deliver'
  route: string
  truckPlate: string
} | null

// ── Component ─────────────────────────────────────────────────
export default function CompanyActiveShipments() {
  const { user } = useAuth()
  const rawToken  = user?.token ?? null
  const apiToken  = getApiToken(rawToken)

  const [refresh,      setRefresh]      = useState(0)
  const [apiShipments, setApiShipments] = useState<CompanyShipment[]>([])
  const [apiTrucks,    setApiTrucks]    = useState<CompanyTruck[]>([])
  const [loadingState, setLoadingState] = useState<'idle' | 'loading' | 'error' | 'success'>('idle')
  const [error,        setError]        = useState<string | null>(null)
  const [actionLoading,setActionLoading]= useState<string | null>(null)
  const [modal,        setModal]        = useState<ModalState>(null)
  const [filter,       setFilter]       = useState<Filter>('ALL')

  // ── Load data ───────────────────────────────────────────────
  useEffect(() => {
    const t = apiToken
    if (!t) { ensureSeedCompanyData(); return }
    const token: string = t
    let cancelled = false
    async function load() {
      setLoadingState('loading')
      setError(null)
      try {
        const [shipments, trucks] = await Promise.all([
          getActiveShipments(token),
          getMyTrucks(token),
        ])
        if (cancelled) return
        setApiShipments(shipments)
        setApiTrucks(trucks)
        setLoadingState('success')
      } catch (e) {
        if (cancelled) return
        setError((e as ApiError).message || 'Could not load shipments.')
        setLoadingState('error')
      }
    }
    void load()
    return () => { cancelled = true }
  }, [apiToken, refresh])

  // ── Normalise to flat list ───────────────────────────────────
  const ORDER: Record<string, number> = {
    AWAITING_ESCROW: 0, ESCROW_FUNDED: 1, IN_TRANSIT: 2, AWAITING_CONFIRMATION: 3, COMPLETED: 4,
  }

  const allShipments = useMemo((): Shipment[] => {
    if (apiToken) {
      return apiShipments
        .filter((s) => s.status in ORDER)
        .map((s) => ({
          id:          String(s.id),
          pickup:      s.pickup_district  ?? s.pickupDistrict  ?? '—',
          dropoff:     s.dropoff_district ?? s.dropoffDistrict ?? '—',
          weight:      s.weight_tons      ?? s.weightTons      ?? 0,
          price:       s.offered_price_rwf ?? s.offeredPriceRwf ?? 0,
          status:      s.status as AllStatus,
          shipperName: s.shipper_name ?? s.shipperName ?? '—',
          shipperPhone:s.shipper_phone ?? s.shipperPhone ?? null,
          truckPlate:  s.truck_plate  ?? s.truckPlate  ?? null,
          createdAt:   s.created_at   ?? s.createdAt,
        }))
        .sort((a, b) => (ORDER[a.status] ?? 9) - (ORDER[b.status] ?? 9))
    }
    return getCompanyActiveDemoShipments().map((s) => ({
      id: s.id, pickup: s.pickup, dropoff: s.dropoff,
      weight: s.weightTons, price: s.priceRwf, status: s.status,
      shipperName: s.shipperName, shipperPhone: s.shipperPhone,
      truckPlate: s.truckPlate, createdAt: s.createdAt,
    }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiToken, apiShipments, refresh])

  const filtered = useMemo(() =>
    filter === 'ALL' ? allShipments : allShipments.filter((s) => s.status === filter),
  [allShipments, filter])

  const counts: Record<Filter, number> = {
    ALL:                   allShipments.length,
    AWAITING_ESCROW:       allShipments.filter((s) => s.status === 'AWAITING_ESCROW').length,
    ESCROW_FUNDED:         allShipments.filter((s) => s.status === 'ESCROW_FUNDED').length,
    AWAITING_CONFIRMATION: allShipments.filter((s) => s.status === 'AWAITING_CONFIRMATION').length,
    COMPLETED:             allShipments.filter((s) => s.status === 'COMPLETED').length,
  }

  // ── Actions ─────────────────────────────────────────────────
  function openModal(shipmentId: string, action: 'pickup' | 'deliver', route: string, truckPlate: string | null) {
    setModal({ shipmentId, action, route, truckPlate: truckPlate ?? '—' })
  }

  async function confirmAction() {
    if (!modal) return
    const { shipmentId, action } = modal
    setModal(null)
    setError(null)
    setActionLoading(shipmentId + '-' + action)
    try {
      if (apiToken) {
        const shipment  = apiShipments.find((s) => String(s.id) === shipmentId)
        const plate     = shipment?.truck_plate ?? shipment?.truckPlate ?? ''
        const truckObj  = apiTrucks.find((t) => (t.plate_number ?? t.plateNumber ?? '') === plate)
        const truckId   = truckObj?.id ?? plate
        if (action === 'pickup') await pickupShipment(apiToken, shipmentId, truckId)
        else                     await deliverShipment(apiToken, shipmentId, truckId)
      } else {
        if (action === 'pickup') updateCompanyDemoShipmentStatus(shipmentId, 'IN_TRANSIT')
        else                     updateCompanyDemoShipmentStatus(shipmentId, 'AWAITING_CONFIRMATION')
      }
      setRefresh((v) => v + 1)
    } catch (e) {
      setError((e as ApiError).message || `Could not confirm ${action}.`)
    } finally {
      setActionLoading(null)
    }
  }

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="max-w-4xl space-y-6 ll-animate-in">

      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">Company</p>
          <h1 className="text-2xl font-bold text-stone-900 mt-1">Active Shipments</h1>
          <p className="text-sm text-stone-500 mt-1">Confirm pickup and delivery as shipments progress.</p>
        </div>
        <button
          type="button"
          onClick={() => setRefresh((v) => v + 1)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-sidebar text-white text-sm font-semibold hover:bg-stone-800 transition-colors"
        >
          <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Filter tabs — color matches the status */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = filter === f.value
          // For ALL tab use sidebar, otherwise use the status color
          const activeCfg = f.value === 'ALL' ? null : STATUS[f.value as AllStatus]
          const activeStyle = activeCfg
            ? `${activeCfg.tabBg} ${activeCfg.tabText} ${activeCfg.tabBorder}`
            : 'bg-sidebar text-white border-sidebar'

          return (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                active
                  ? activeStyle
                  : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
              }`}
            >
              {/* Dot — only show on non-ALL tabs */}
              {f.value !== 'ALL' && (
                <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-white' : STATUS[f.value as AllStatus].dot}`} />
              )}
              {f.label}
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                active ? 'bg-black/20 text-white' : 'bg-stone-100 text-stone-500'
              }`}>
                {counts[f.value]}
              </span>
            </button>
          )
        })}
      </div>

      {/* Error / loading */}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-2xl px-4 py-3">{error}</p>
      )}
      {apiToken && loadingState === 'loading' && (
        <p className="text-sm text-stone-400">Loading…</p>
      )}

      {/* Empty state */}
      {filtered.length === 0 && loadingState !== 'loading' && (
        <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center">
          <p className="text-stone-400 text-sm">
            {filter === 'COMPLETED'             ? 'No completed shipments yet.' :
             filter === 'AWAITING_ESCROW'       ? 'No pending shipper payments.' :
             filter === 'ESCROW_FUNDED'         ? 'No shipments ready for pickup.' :
             filter === 'AWAITING_CONFIRMATION' ? 'No shipments awaiting confirmation.' :
                                                  'No shipments right now.'}
          </p>
        </div>
      )}

      {/* Cards */}
      <div className="space-y-3">
        {filtered.map((s) => {
          const cfg        = STATUS[s.status]
          const isActioning = actionLoading?.startsWith(s.id)
          const route      = `${s.pickup} → ${s.dropoff}`
          const isCompleted = s.status === 'COMPLETED'

          return (
            <div
              key={s.id}
              className={`rounded-3xl border-2 ${cfg.cardBorder} ${cfg.cardBg} shadow-sm overflow-hidden transition-all ${isCompleted ? 'opacity-75' : ''}`}
            >
              <div className="p-5 space-y-4">

                {/* Top: badge + route + price */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.badgeBg} ${cfg.badgeText}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                      {cfg.label}
                      {s.createdAt && isCompleted && (
                        <span className="ml-1 text-stone-400">· {new Date(s.createdAt).toLocaleDateString()}</span>
                      )}
                    </span>
                    <p className={`font-bold text-base mt-1 ${isCompleted ? 'text-stone-600' : 'text-stone-900'}`}>{route}</p>
                    <p className="text-sm text-stone-400">
                      {s.weight} tons · {s.shipperName}
                      {s.shipperPhone ? ` · ${s.shipperPhone}` : ''}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[11px] text-stone-400 font-medium">
                      {isCompleted ? 'Value' : 'Escrow value'}
                    </p>
                    <p className={`text-lg font-extrabold ${isCompleted ? 'text-stone-400' : 'text-stone-900'}`}>
                      {s.price.toLocaleString()} RWF
                    </p>
                  </div>
                </div>

                {/* Truck + action */}
                <div className="flex items-center justify-between gap-4 pt-3 border-t border-black/5">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-stone-300 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
                    </svg>
                    <span className="text-sm font-semibold text-stone-600">{s.truckPlate ?? '—'}</span>
                  </div>

                  {/* Per-status action */}
                  {s.status === 'AWAITING_ESCROW' && (
                    <span className="text-xs font-medium text-red-500 shrink-0">
                      Waiting for shipper to pay escrow
                    </span>
                  )}
                  {s.status === 'ESCROW_FUNDED' && (
                    <button
                      type="button"
                      disabled={isActioning}
                      onClick={() => openModal(s.id, 'pickup', route, s.truckPlate)}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 shrink-0 ${cfg.btnBg} ${cfg.btnText} ${cfg.btnHover}`}
                    >
                      {isActioning ? 'Confirming…' : 'Confirm Pickup'}
                    </button>
                  )}
                  {s.status === 'IN_TRANSIT' && (
                    <button
                      type="button"
                      disabled={isActioning}
                      onClick={() => openModal(s.id, 'deliver', route, s.truckPlate)}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 shrink-0 ${cfg.btnBg} ${cfg.btnText} ${cfg.btnHover}`}
                    >
                      {isActioning ? 'Confirming…' : 'Confirm Delivery'}
                    </button>
                  )}
                  {s.status === 'AWAITING_CONFIRMATION' && (
                    <span className="text-xs font-medium text-orange-500 shrink-0">
                      Waiting for shipper
                    </span>
                  )}
                  {s.status === 'COMPLETED' && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-stone-400 shrink-0">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Done
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Confirmation modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-5">
            <div>
              <h2 className="text-lg font-bold text-stone-900">
                {modal.action === 'pickup' ? 'Confirm Pickup' : 'Confirm Delivery'}
              </h2>
              <p className="text-sm text-stone-400 mt-1">{modal.route}</p>
            </div>

            <div className="rounded-2xl bg-stone-50 border border-stone-200 px-4 py-3 flex items-center gap-3">
              <svg className="w-5 h-5 text-stone-300 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
              </svg>
              <div>
                <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wide">Truck</p>
                <p className="text-sm font-bold text-stone-800">{modal.truckPlate}</p>
              </div>
            </div>

            <p className="text-sm text-stone-600">
              {modal.action === 'pickup'
                ? 'Confirm that your truck has collected the goods and is heading to the destination. The shipment will move to In Transit.'
                : 'Confirm that the goods have been delivered. The shipper will be notified to confirm receipt.'}
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={confirmAction}
                className="flex-1 py-2.5 rounded-xl bg-sidebar text-white text-sm font-semibold hover:bg-stone-800 transition-colors"
              >
                {modal.action === 'pickup' ? 'Yes, Confirm Pickup' : 'Yes, Confirm Delivery'}
              </button>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="flex-1 py-2.5 rounded-xl bg-stone-100 text-stone-700 text-sm font-semibold hover:bg-stone-200 transition-colors"
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
