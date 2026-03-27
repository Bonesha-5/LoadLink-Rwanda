import { useEffect, useState } from 'react'
import { ensureSeedAdminData, getAdminDisputes, resolveDispute as resolveDisputeInStore } from '../data/storage'
import { useAuth } from '../context/AuthContext'
import { getAdminDisputesApi, resolveDisputeApi } from '../api/adminOpsApi'
import type { ApiError } from '../api/http'
import { getApiToken } from '../auth/mockJwt'

type DisputeResolutionChoice = 'COMPANY' | 'SHIPPER' | 'SPLIT'

type DisputedShipment = {
  id: string
  shipperName: string
  companyName: string
  pickup: string
  dropoff: string
  weight: string
  escrowAmount: number
  currency: string
}

type FetchState = 'idle' | 'loading' | 'error' | 'success'

export default function AdminDisputes() {
  const { user } = useAuth()
  const token = getApiToken(user?.token ?? null)
  const [disputes, setDisputes] = useState<DisputedShipment[]>([])
  const [state, setState] = useState<FetchState>('idle')
  const [error, setError] = useState<string | null>(null)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [choice, setChoice] = useState<DisputeResolutionChoice>('COMPANY')
  const [companyAmount, setCompanyAmount] = useState('')
  const [shipperAmount, setShipperAmount] = useState('')

  async function loadDisputes() {
    setState('loading')
    setError(null)
    try {
      if (token) {
        const apiData = await getAdminDisputesApi(token)
        const data = apiData.map(
          (s): DisputedShipment => ({
            id: String(s.id),
            shipperName: s.shipperName ?? s.shipper_name ?? '—',
            companyName: s.companyName ?? s.company_name ?? '—',
            pickup: s.pickupDistrict ?? s.pickup_district ?? '—',
            dropoff: s.dropoffDistrict ?? s.dropoff_district ?? '—',
            weight: `${s.weightTons ?? s.weight_tons ?? '—'} tons`,
            escrowAmount: s.escrowAmount ?? s.escrow_amount ?? s.offeredPriceRwf ?? s.offered_price_rwf ?? 0,
            currency: 'RWF',
          }),
        )
        setDisputes(data)
        setState('success')
        return
      }

      ensureSeedAdminData()
      const data = getAdminDisputes().map((s): DisputedShipment => ({
        id: s.id,
        shipperName: s.shipperName,
        companyName: s.companyName ?? '—',
        pickup: s.pickupDistrict,
        dropoff: s.dropoffDistrict,
        weight: `${s.weightTons} tons`,
        escrowAmount: s.offeredPriceRwf,
        currency: 'RWF',
      }))
      setDisputes(data)
      setState('success')
    } catch (err) {
      console.error(err)
      setDisputes([])
      const e = err as ApiError
      setError(token ? (e.message || 'Could not load disputes.') : 'Could not load disputes from local demo data.')
      setState('error')
    }
  }

  useEffect(() => {
    void loadDisputes()
  }, [])

  function openResolutionModal(dispute: DisputedShipment) {
    setSelectedId(dispute.id)
    setChoice('COMPANY')
    setCompanyAmount(String(dispute.escrowAmount))
    setShipperAmount('0')
  }

  function closeModal() {
    setSelectedId(null)
    setChoice('COMPANY')
    setCompanyAmount('')
    setShipperAmount('')
  }

  const currentDispute = disputes.find((d) => d.id === selectedId) ?? null
  const escrowTotal = currentDispute?.escrowAmount ?? 0

  const commission = Math.round(escrowTotal * 0.05)
  const splitTarget = escrowTotal - commission
  const splitValid =
    choice !== 'SPLIT' ||
    (!Number.isNaN(Number(companyAmount)) &&
      !Number.isNaN(Number(shipperAmount)) &&
      Number(companyAmount) + Number(shipperAmount) === splitTarget)

  async function resolveDispute(e: React.FormEvent) {
    e.preventDefault()
    if (!currentDispute) return

    let payload: any
    if (choice === 'COMPANY') {
      payload = { type: 'COMPANY_FULL' }
    } else if (choice === 'SHIPPER') {
      payload = { type: 'SHIPPER_FULL' }
    } else {
      payload = {
        type: 'SPLIT',
        companyAmount: Number(companyAmount),
        shipperAmount: Number(shipperAmount),
      }
    }

    try {
      if (token) {
        await resolveDisputeApi(token, currentDispute.id, payload)
      } else {
        resolveDisputeInStore(currentDispute.id, payload, 'Admin')
      }
      setDisputes((prev) => prev.filter((d) => d.id !== currentDispute.id))
      closeModal()
      alert(`Dispute ${currentDispute.id} resolved.`)
    } catch (err) {
      console.error(err)
      alert('Could not resolve this dispute. Please try again.')
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Disputes</h1>
          <p className="text-sm text-stone-600 mt-1">
            When a shipper reports a problem, decide how the held payment should be released.
          </p>
        </div>
        <button
          type="button"
          onClick={loadDisputes}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-600 hover:text-stone-900 hover:underline"
        >
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
          Refresh
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs text-stone-600">
        <span className="inline-flex items-center gap-2 rounded-full bg-cream px-3 py-1 border border-stone-200">
          <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
          <span className="font-semibold text-stone-800">
            {disputes.length}
          </span>
          <span className="text-stone-600">
            active dispute{disputes.length === 1 ? '' : 's'}
          </span>
        </span>
        <span className="hidden sm:inline text-stone-500">
          Keep notes clear and aim for a fair outcome.
        </span>
      </div>

      {state === 'loading' && (
        <p className="text-stone-500 text-sm mb-4">Loading disputed shipments…</p>
      )}

      {state === 'error' && error && (
        <p className="text-red-600 text-sm mb-4">{error}</p>
      )}

      {state === 'success' && error && (
        <p className="text-amber-600 text-xs mb-3">{error}</p>
      )}

      {state === 'success' && disputes.length === 0 && (
        <div className="bg-white border border-stone-200 rounded-3xl p-10 text-center shadow-sm">
          <p className="text-stone-600">
            There are no active disputes at the moment.
          </p>
        </div>
      )}

      {disputes.length > 0 && (
        <div className="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="px-4 py-3 font-semibold text-stone-700">ID</th>
                <th className="px-4 py-3 font-semibold text-stone-700">Shipper</th>
                <th className="px-4 py-3 font-semibold text-stone-700">Company</th>
                <th className="px-4 py-3 font-semibold text-stone-700">Route</th>
                <th className="px-4 py-3 font-semibold text-stone-700">Weight</th>
                <th className="px-4 py-3 font-semibold text-stone-700">Held payment</th>
                <th className="px-4 py-3 font-semibold text-stone-700 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {disputes.map((d) => (
                <tr key={d.id} className="border-b border-stone-100 last:border-0">
                  <td className="px-4 py-3 font-mono text-xs text-stone-700">{d.id}</td>
                  <td className="px-4 py-3 text-stone-800">{d.shipperName}</td>
                  <td className="px-4 py-3 text-stone-800">{d.companyName}</td>
                  <td className="px-4 py-3 text-stone-700">
                    {d.pickup} → {d.dropoff}
                  </td>
                  <td className="px-4 py-3 text-stone-700">{d.weight}</td>
                  <td className="px-4 py-3 text-stone-800 font-semibold">
                    {d.escrowAmount.toLocaleString()} {d.currency}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openResolutionModal(d)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-accent text-white hover:bg-accent-hover"
                    >
                      Resolve
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {currentDispute && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 px-4"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-stone-800 mb-2">
              Resolve dispute — {currentDispute.id}
            </h2>
            <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 mb-4 space-y-1 text-sm">
              <p className="font-semibold text-amber-800">Escrow held: {currentDispute.escrowAmount.toLocaleString()} {currentDispute.currency}</p>
              <p className="text-amber-700">LoadLink 5% commission: <span className="font-semibold">{commission.toLocaleString()} {currentDispute.currency}</span></p>
              <p className="text-amber-700">Available to split: <span className="font-semibold">{splitTarget.toLocaleString()} {currentDispute.currency}</span></p>
              <p className="text-xs text-amber-600 mt-1">Full refund = shipper gets full escrow back, platform earns nothing.</p>
            </div>
            <p className="text-xs text-stone-500 mb-4">
              Choose how the held payment should be released.
            </p>
            <form onSubmit={resolveDispute} className="space-y-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm text-stone-800">
                  <input
                    type="radio"
                    name="resolution"
                    value="COMPANY"
                    checked={choice === 'COMPANY'}
                    onChange={() => {
                      setChoice('COMPANY')
                      setCompanyAmount(String(splitTarget))
                      setShipperAmount('0')
                    }}
                  />
                  Full release to company — company gets {splitTarget.toLocaleString()}, platform keeps {commission.toLocaleString()} commission
                </label>
                <label className="flex items-center gap-2 text-sm text-stone-800">
                  <input
                    type="radio"
                    name="resolution"
                    value="SHIPPER"
                    checked={choice === 'SHIPPER'}
                    onChange={() => {
                      setChoice('SHIPPER')
                      setCompanyAmount('0')
                      setShipperAmount(String(escrowTotal))
                    }}
                  />
                  Full refund to shipper — shipper gets {escrowTotal.toLocaleString()} in full, platform earns 0
                </label>
                <label className="flex items-center gap-2 text-sm text-stone-800">
                  <input
                    type="radio"
                    name="resolution"
                    value="SPLIT"
                    checked={choice === 'SPLIT'}
                    onChange={() => setChoice('SPLIT')}
                  />
                  Split between both sides
                </label>
              </div>

              {choice === 'SPLIT' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-stone-600">Company gets</span>
                    <input
                      type="number"
                      min={0}
                      className="w-32 px-2 py-1.5 rounded-lg border border-stone-300 text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                      value={companyAmount}
                      onChange={(e) => setCompanyAmount(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-stone-600">Shipper gets</span>
                    <input
                      type="number"
                      min={0}
                      className="w-32 px-2 py-1.5 rounded-lg border border-stone-300 text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                      value={shipperAmount}
                      onChange={(e) => setShipperAmount(e.target.value)}
                    />
                  </div>
                  <p className="text-xs text-stone-500">
                    Must add up to {splitTarget.toLocaleString()} {currentDispute.currency} — that is the escrow of {escrowTotal.toLocaleString()} minus our {commission.toLocaleString()} commission.
                  </p>
                  {!splitValid && (
                    <p className="text-xs text-red-600">
                      Company + shipper must add up to exactly {splitTarget.toLocaleString()} {currentDispute.currency}.
                    </p>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-semibold rounded-xl bg-stone-100 text-stone-700 hover:bg-stone-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={choice === 'SPLIT' && !splitValid}
                  className="px-4 py-2 text-sm font-semibold rounded-xl bg-accent text-white hover:bg-accent-hover disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Resolve dispute
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
