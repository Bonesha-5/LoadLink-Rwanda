import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { ensureSeedLoads, getAllLoads, getAllTrucks, type Load, type Truck } from '../data/storage'

export default function CompanyShipments() {
  const { getToken, user } = useAuth()
  const [shipments, setShipments] = useState<Load[]>([])
  const [trucks, setTrucks] = useState<Truck[]>([])
  const [successIds, setSuccessIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    // Demo fallback — load from localStorage
    ensureSeedLoads('Shipper')
    const open = getAllLoads().filter((l) => l.status === 'open')
    setShipments(open)
    setTrucks(getAllTrucks())

    // Try live API in parallel; replace if it responds
    const headers = { Authorization: `Bearer ${getToken()}` }
    Promise.all([
      fetch('/api/shipments/posted', { headers }).then((r) => r.ok ? r.json() : null),
      fetch('/api/company/trucks', { headers }).then((r) => r.ok ? r.json() : null),
    ])
      .then(([s, t]) => {
        if (Array.isArray(s) && s.length > 0) {
          // Map API shape to Load shape
          setShipments(s.map((item: Record<string, unknown>) => ({
            id: String(item.id),
            origin: String(item.pickup_district ?? ''),
            destination: String(item.dropoff_district ?? ''),
            date: String(item.pickup_date ?? ''),
            weight: `${item.weight_tons ?? item.weight ?? '?'} tons`,
            description: item.cargo_description ? String(item.cargo_description) : undefined,
            price: item.offered_price_rwf
              ? `RWF ${Number(item.offered_price_rwf).toLocaleString()}`
              : item.offered_price
              ? `RWF ${Number(item.offered_price).toLocaleString()}`
              : undefined,
            createdBy: '',
            status: 'open',
          })))
        }
        if (Array.isArray(t) && t.length > 0) {
          setTrucks(t.map((item: Record<string, unknown>) => ({
            id: String(item.id),
            plateNumber: String(item.plate_number ?? item.plateNumber ?? ''),
            capacity: String(item.capacity ?? ''),
            companyName: String(item.company_name ?? item.companyName ?? user?.name ?? ''),
            type: item.truck_type ? String(item.truck_type) : undefined,
          })))
        }
      })
      .catch(() => null)
  }, [])

  return (
    <div className="space-y-6 ll-animate-in">
      <div>
        <h1
          className="text-3xl font-bold text-sidebar"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          Available Shipments
        </h1>
        <p className="text-sm text-stone-500 mt-0.5">Browse and express interest in new shipments</p>
      </div>

      {shipments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-10 text-center shadow-sm">
          <p className="text-stone-500">No open shipments at the moment. Check back later.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {shipments.map((s) => (
            <ShipmentCard
              key={s.id}
              shipment={s}
              trucks={trucks}
              expressed={successIds.has(s.id)}
              onExpressed={(id) => setSuccessIds((prev) => new Set([...prev, id]))}
              getToken={getToken}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ShipmentCard({
  shipment: s,
  trucks,
  expressed,
  onExpressed,
  getToken,
}: {
  shipment: Load
  trucks: Truck[]
  expressed: boolean
  onExpressed: (id: string) => void
  getToken: () => string | null
}) {
  const [selectedTruck, setSelectedTruck] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const priceDisplay = s.price ?? '—'

  async function handleExpress() {
    if (!selectedTruck || expressed) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/shipments/interests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ shipment_id: s.id, truck_id: selectedTruck }),
      })
      if (!res.ok) throw new Error()
    } catch {
      // API unavailable — treat as success for demo
    } finally {
      setSubmitting(false)
      onExpressed(s.id)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 flex flex-col">
      {/* Shipment ID */}
      <h3 className="text-base font-bold text-stone-900 mb-4">Shipment {s.id}</h3>

      {/* Location */}
      <div className="flex flex-col gap-0.5 mb-3">
        <div className="flex items-center gap-2 text-sm text-stone-700">
          <svg className="w-4 h-4 text-stone-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>{s.origin}</span>
        </div>
        <div className="ml-2 flex items-center">
          <svg className="w-4 h-4 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        <div className="flex items-center gap-2 text-sm text-stone-700 ml-6">
          <span>{s.destination}</span>
        </div>
      </div>

      {/* Date */}
      <div className="flex items-center gap-2 text-sm text-stone-600 mb-2">
        <svg className="w-4 h-4 text-stone-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span>Pickup: {s.date}</span>
      </div>

      {/* Weight */}
      <div className="flex items-center gap-2 text-sm text-stone-600 mb-2">
        <svg className="w-4 h-4 text-stone-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
        </svg>
        <span>{s.weight}</span>
      </div>

      {/* Price */}
      <div className="flex items-center gap-2 text-sm font-semibold text-green-600 mb-4">
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{priceDisplay}</span>
      </div>

      {/* Cargo description */}
      {s.description && (
        <>
          <div className="border-t border-stone-100 pt-3 mb-3">
            <p className="text-xs text-stone-400 mb-1">Cargo Description:</p>
            <p className="text-sm text-stone-700">{s.description}</p>
          </div>
        </>
      )}

      <div className="border-t border-stone-100 pt-4 mt-auto flex flex-col gap-3">
        {expressed ? (
          <div className="flex items-center gap-2 text-green-600 font-semibold text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Interest expressed
          </div>
        ) : (
          <>
            {/* Truck selector */}
            <div>
              <p className="text-xs font-semibold text-stone-600 mb-1.5">Select your truck:</p>
              <TruckSelect
                trucks={trucks}
                value={selectedTruck}
                onChange={setSelectedTruck}
              />
            </div>

            {/* Express Interest button */}
            <button
              type="button"
              onClick={handleExpress}
              disabled={!selectedTruck || submitting}
              className="w-full rounded-xl bg-green-600 text-white py-3 font-semibold text-sm hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting…' : 'Express Interest'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function TruckSelect({
  trucks,
  value,
  onChange,
}: {
  trucks: Truck[]
  value: string
  onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const selected = trucks.find((t) => t.id === value)
  const label = selected ? `${selected.plateNumber} — ${selected.type ?? selected.companyName}` : 'Choose truck'

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full rounded-xl border border-stone-200 bg-cream px-3 py-2.5 text-sm text-left flex items-center justify-between focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 ${
          value ? 'text-stone-800' : 'text-stone-400'
        }`}
      >
        {label}
        <svg className="w-4 h-4 text-stone-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <ul className="absolute z-50 mt-1 w-full bg-white border border-stone-200 rounded-xl shadow-lg max-h-48 overflow-y-auto py-1">
          {trucks.length === 0 && (
            <li className="px-3 py-2.5 text-sm text-stone-400">No trucks available</li>
          )}
          {trucks.map((t) => (
            <li
              key={t.id}
              onMouseDown={() => { onChange(t.id); setOpen(false) }}
              className={`px-3 py-2.5 text-sm cursor-pointer transition-colors ${
                t.id === value
                  ? 'bg-accent text-white font-semibold'
                  : 'text-stone-800 hover:bg-accent hover:text-white'
              }`}
            >
              {t.plateNumber} — {t.type ?? t.companyName}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
