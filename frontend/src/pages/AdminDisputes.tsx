import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getAdminDisputesApi, resolveDisputeApi } from '../api/adminOpsApi'
import type { ApiError } from '../api/http'

type ResolutionType = 'FULL_RELEASE' | 'FULL_REFUND' | 'SPLIT'

type DisputedShipment = {
  shipment_id: string
  shipper_name: string
  shipper_email: string
  shipper_phone: string
  company_name: string
  truck_plate: string
  pickup_district: string
  dropoff_district: string
  weight: number
  offered_price: number
  escrow_amount: number
  payment_status: string
}

export default function AdminDisputes() {
  const { user } = useAuth()
  const token = user?.token ?? ''

  const [disputes, setDisputes] = useState<DisputedShipment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [resolution, setResolution] = useState<ResolutionType>('FULL_RELEASE')
  const [companyAmount, setCompanyAmount] = useState('')
  const [shipperAmount, setShipperAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [resolveError, setResolveError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await getAdminDisputesApi(token)
      setDisputes(data as any)
    } catch (e) {
      setError((e as ApiError).message || 'Could not load disputes.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  const currentDispute = disputes.find(d => d.shipment_id === selectedId) ?? null
  const escrow = currentDispute?.escrow_amount ?? 0
  const commission = Math.round(escrow * 0.05)
  const splitTarget = escrow - commission

  async function resolveDispute(e: React.FormEvent) {
    e.preventDefault()
    if (!currentDispute) return
    setSubmitting(true)
    setResolveError(null)
    try {
      await resolveDisputeApi(
        token,
        currentDispute.shipment_id,
        resolution,
        resolution === 'SPLIT' ? Number(shipperAmount) : undefined,
        resolution === 'SPLIT' ? Number(companyAmount) : undefined,
      )
      setDisputes(prev => prev.filter(d => d.shipment_id !== currentDispute.shipment_id))
      setSelectedId(null)
    } catch (e) {
      setResolveError((e as ApiError).message || 'Could not resolve dispute.')
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
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Disputes</h1>
          <p className="text-sm text-stone-600 mt-1">Review and resolve disputed shipments.</p>
        </div>
        <button type="button" onClick={load}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-600 hover:text-stone-900 hover:underline">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {disputes.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-3xl p-10 text-center shadow-sm">
          <p className="text-stone-500 text-sm">No disputed shipments.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {disputes.map(d => (
            <div key={d.shipment_id} className="bg-white border border-red-200 rounded-2xl p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-bold text-stone-900">
                    {d.pickup_district} → {d.dropoff_district}
                  </p>
                  <div className="mt-2 space-y-1 text-sm text-stone-600">
                    <p>Shipper: <span className="font-semibold text-stone-800">{d.shipper_name}</span> · {d.shipper_phone}</p>
                    <p>Company: <span className="font-semibold text-stone-800">{d.company_name}</span> · {d.truck_plate}</p>
                    <p>Escrow: <span className="font-semibold text-stone-800">{Number(d.escrow_amount).toLocaleString()} RWF</span></p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(d.shipment_id)
                    setResolution('FULL_RELEASE')
                    setCompanyAmount('')
                    setShipperAmount('')
                    setResolveError(null)
                  }}
                  className="px-4 py-2 rounded-xl bg-sidebar text-white text-sm font-semibold hover:bg-stone-800 transition-colors"
                >
                  Resolve
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Resolution modal */}
      {currentDispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 px-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-bold text-stone-900 mb-1">Resolve Dispute</h2>
            <p className="text-sm text-stone-600 mb-1">
              {currentDispute.pickup_district} → {currentDispute.dropoff_district}
            </p>
            <p className="text-sm text-stone-600 mb-4">
              Escrow: <span className="font-semibold">{Number(currentDispute.escrow_amount).toLocaleString()} RWF</span>
              {' '}· Commission (5%): <span className="font-semibold">{commission.toLocaleString()} RWF</span>
            </p>

            <form onSubmit={resolveDispute} className="space-y-4">
              <div className="space-y-2">
                {([
                  { value: 'FULL_RELEASE', label: 'Full release to company', desc: `Company gets ${(escrow - commission).toLocaleString()} RWF` },
                  { value: 'FULL_REFUND', label: 'Full refund to shipper', desc: `Shipper gets ${escrow.toLocaleString()} RWF back` },
                  { value: 'SPLIT', label: 'Split between both', desc: `Split ${splitTarget.toLocaleString()} RWF after commission` },
                ] as { value: ResolutionType; label: string; desc: string }[]).map(opt => (
                  <label key={opt.value} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    resolution === opt.value ? 'border-sidebar bg-sidebar/5' : 'border-stone-200 hover:bg-stone-50'
                  }`}>
                    <input
                      type="radio"
                      name="resolution"
                      value={opt.value}
                      checked={resolution === opt.value}
                      onChange={() => setResolution(opt.value)}
                      className="mt-0.5"
                    />
                    <div>
                      <p className="text-sm font-semibold text-stone-800">{opt.label}</p>
                      <p className="text-xs text-stone-500">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>

              {resolution === 'SPLIT' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-600 mb-1">Company amount (RWF)</label>
                    <input
                      type="number"
                      value={companyAmount}
                      onChange={e => setCompanyAmount(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-accent"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-600 mb-1">Shipper amount (RWF)</label>
                    <input
                      type="number"
                      value={shipperAmount}
                      onChange={e => setShipperAmount(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-accent"
                      placeholder="0"
                    />
                  </div>
                  <p className="col-span-2 text-xs text-stone-500">
                    Must add up to {splitTarget.toLocaleString()} RWF (escrow minus 5% commission)
                  </p>
                </div>
              )}

              {resolveError && <p className="text-sm text-red-600">{resolveError}</p>}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-sidebar text-white font-semibold text-sm hover:bg-stone-800 disabled:opacity-60"
                >
                  {submitting ? 'Resolving…' : 'Confirm Resolution'}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-700 font-semibold text-sm hover:bg-stone-50"
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
