import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getActiveShipments, getMyTrucks, type CompanyTruck } from '../api/companyOpsApi'
import { apiRequest } from '../api/http'
import type { ApiError } from '../api/http'

type AllStatus = 'ESCROW_FUNDED' | 'IN_TRANSIT' | 'AWAITING_CONFIRMATION' | 'COMPLETED'
type Filter    = 'ALL' | 'ESCROW_FUNDED' | 'AWAITING_CONFIRMATION' | 'COMPLETED'

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
  truckId: string | null
  createdAt?: string
}

type ModalState = {
  shipmentId: string
  action: 'pickup' | 'deliver'
  route: string
  truckPlate: string
  truckId: string
} | null

type StatusConfig = {
  label: string
  cardBorder: string
  cardBg: string
  badgeBg: string
  badgeText: string
  dot: string
  tabBg: string
  tabText: string
  tabBorder: string
  btnBg: string
  btnText: string
  btnHover: string
}

const STATUS: Record<AllStatus, StatusConfig> = {
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
    label:      'Delivered — Awaiting Confirmation',
    cardBorder: 'border-violet-300',
    cardBg:     'bg-violet-50',
    badgeBg:    'bg-violet-100',
    badgeText:  'text-violet-700',
    dot:        'bg-violet-500',
    tabBg:      'bg-violet-600',
    tabText:    'text-white',
    tabBorder:  'border-violet-600',
    btnBg:      '',
    btnText:    '',
    btnHover:   '',
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

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'ALL',                   label: 'All' },
  { value: 'ESCROW_FUNDED',         label: 'Ready for Pickup' },
  { value: 'AWAITING_CONFIRMATION', label: 'In Transit' },
  { value: 'COMPLETED',             label: 'History' },
]

export default function CompanyActiveShipments() {
  const { user } = useAuth()
  const token = user?.token ?? ''

  const [shipments,    setShipments]    = useState<Shipment[]>([])
  const [trucks,       setTrucks]       = useState<CompanyTruck[]>([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState<string | null>(null)
  const [actionLoading,setActionLoading]= useState<string | null>(null)
  const [modal,        setModal]        = useState<ModalState>(null)
  const [filter,       setFilter]       = useState<Filter>('ALL')
  const [refresh,      setRefresh]      = useState(0)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [raw, t] = await Promise.all([
        getActiveShipments(token),
        getMyTrucks(token),
      ])
      // Map backend field names to our Shipment type
      const mapped: Shipment[] = (raw as any[]).map(s => ({
        id:          String(s.shipment_id ?? s.id),
        pickup:      s.pickup_district ?? '—',
        dropoff:     s.dropoff_district ?? '—',
        weight:      Number(s.weight) || 0,
        price:       Number(s.offered_price) || 0,
        status:      (s.shipment_status ?? s.status) as AllStatus,
        shipperName: s.shipper_name ?? '—',
        shipperPhone:s.shipper_phone ?? null,
        truckPlate:  s.plate_number ?? null,
        truckId:     String(s.truck_id ?? ''),
        createdAt:   s.created_at,
      }))
      setShipments(mapped)
      setTrucks(t)
    } catch (e) {
      setError((e as ApiError).message || 'Could not load shipments.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [refresh])

  const filtered = useMemo(() => {
    if (filter === 'ALL') return shipments
    if (filter === 'AWAITING_CONFIRMATION') {
      return shipments.filter(s => s.status === 'IN_TRANSIT' || s.status === 'AWAITING_CONFIRMATION')
    }
    return shipments.filter(s => s.status === filter)
  }, [shipments, filter])

  const counts: Record<Filter, number> = {
    ALL:                   shipments.length,
    ESCROW_FUNDED:         shipments.filter(s => s.status === 'ESCROW_FUNDED').length,
    AWAITING_CONFIRMATION: shipments.filter(s => s.status === 'IN_TRANSIT' || s.status === 'AWAITING_CONFIRMATION').length,
    COMPLETED:             shipments.filter(s => s.status === 'COMPLETED').length,
  }

  function openModal(s: Shipment, action: 'pickup' | 'deliver') {
    // Find truck id — use from shipment or look up by plate
    const truckId = s.truckId ||
      String(trucks.find(t => t.plate_number === s.truckPlate)?.id ?? '')
    setModal({
      shipmentId: s.id,
      action,
      route: `${s.pickup} → ${s.dropoff}`,
      truckPlate: s.truckPlate ?? '—',
      truckId,
    })
  }

  async function confirmAction() {
    if (!modal) return
    const { shipmentId, action, truckId } = modal
    setModal(null)
    setError(null)
    setActionLoading(shipmentId + '-' + action)
    try {
      await apiRequest(`/api/shipments/${shipmentId}/${action === 'pickup' ? 'pickup' : 'deliver'}`, {
        method: 'PATCH',
        token,
        body: { truckId },
      })
      setRefresh(v => v + 1)
    } catch (e) {
      setError((e as ApiError).message || `Could not confirm ${action}.`)
    } finally {
      setActionLoading(null)
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
    <div className="max-w-4xl space-y-6 ll-animate-in">

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">Company</p>
          <h1 className="text-2xl font-bold text-stone-900 mt-1">Active Shipments</h1>
          <p className="text-sm text-stone-500 mt-1">Confirm pickup and delivery as shipments progress.</p>
        </div>
        <button
          type="button"
          onClick={() => setRefresh(v => v + 1)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-sidebar text-white text-sm font-semibold hover:bg-stone-800 transition-colors"
        >
          <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = filter === f.value
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
                active ? activeStyle : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
              }`}
            >
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

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-2xl px-4 py-3">{error}</p>
      )}

      {filtered.length === 0 && (
        <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center">
          <p className="text-stone-400 text-sm">
            {filter === 'COMPLETED'             ? 'No completed shipments yet.' :
             filter === 'ESCROW_FUNDED'         ? 'No shipments ready for pickup.' :
             filter === 'AWAITING_CONFIRMATION' ? 'No in-transit shipments.' :
                                                  'No active shipments right now.'}
          </p>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((s) => {
          const cfg         = STATUS[s.status] ?? STATUS.COMPLETED
          const isActioning = actionLoading?.startsWith(s.id)
          const isCompleted = s.status === 'COMPLETED'
          const route       = `${s.pickup} → ${s.dropoff}`

          return (
            <div
              key={s.id}
              className={`rounded-3xl border-2 ${cfg.cardBorder} ${cfg.cardBg} shadow-sm overflow-hidden transition-all ${isCompleted ? 'opacity-75' : ''}`}
            >
              <div className="p-5 space-y-4">

                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.badgeBg} ${cfg.badgeText}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                      {cfg.label}
                    </span>
                    <p className={`font-bold text-base mt-1 ${isCompleted ? 'text-stone-600' : 'text-stone-900'}`}>{route}</p>
                    <p className="text-sm text-stone-400">
                      {s.weight} kg · {s.shipperName}
                      {s.shipperPhone ? ` · ${s.shipperPhone}` : ''}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[11px] text-stone-400 font-medium">
                      {isCompleted ? 'Value' : 'Escrow value'}
                    </p>
                    <p className={`text-lg font-extrabold ${isCompleted ? 'text-stone-400' : 'text-stone-900'}`}>
                      {Number(s.price).toLocaleString()} RWF
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 pt-3 border-t border-black/5">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-stone-300 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
                    </svg>
                    <span className="text-sm font-semibold text-stone-600">{s.truckPlate ?? '—'}</span>
                  </div>

                  {s.status === 'ESCROW_FUNDED' && (
                    <button
                      type="button"
                      disabled={!!isActioning}
                      onClick={() => openModal(s, 'pickup')}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 shrink-0 ${cfg.btnBg} ${cfg.btnText} ${cfg.btnHover}`}
                    >
                      {isActioning ? 'Confirming…' : 'Confirm Pickup'}
                    </button>
                  )}
                  {s.status === 'IN_TRANSIT' && (
                    <button
                      type="button"
                      disabled={!!isActioning}
                      onClick={() => openModal(s, 'deliver')}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 shrink-0 ${cfg.btnBg} ${cfg.btnText} ${cfg.btnHover}`}
                    >
                      {isActioning ? 'Confirming…' : 'Confirm Delivery'}
                    </button>
                  )}
                  {s.status === 'AWAITING_CONFIRMATION' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-violet-100 text-violet-700 border border-violet-200 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
                      Awaiting shipper confirmation
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
                ? 'Confirm that your truck has collected the goods and is heading to the destination.'
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
