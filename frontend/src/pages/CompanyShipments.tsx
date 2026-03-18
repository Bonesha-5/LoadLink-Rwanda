import { useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  getAllLoads,
  addOfferToLoad,
  ensureSeedLoads,
  getTrucksByCompany,
} from '../data/storage'

export default function CompanyShipments() {
  const { user } = useAuth()
  const companyName = user?.name ?? ''
  const [refresh, setRefresh] = useState(0)
  const [offerLoadId, setOfferLoadId] = useState<string | null>(null)
  const [offerMessage, setOfferMessage] = useState('')

  const loads = useMemo(() => {
    void refresh
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
  }, [refresh, companyName])

  const fleetCount = useMemo(() => {
    void refresh
    return getTrucksByCompany(companyName).length
  }, [companyName, refresh])

  function openOfferModal(loadId: string) {
    setOfferLoadId(loadId)
    setOfferMessage('')
  }

  function closeOfferModal() {
    setOfferLoadId(null)
    setOfferMessage('')
  }

  function handleSubmitOffer(e: React.FormEvent) {
    e.preventDefault()
    if (!offerLoadId || !offerLoad) return
    // For fixed-price marketplace: we accept the shipment at the listed price.
    const amount = offerLoad.price ?? 'ACCEPTED'
    addOfferToLoad(offerLoadId, companyName, amount, offerMessage.trim() || undefined)
    closeOfferModal()
    setRefresh((v) => v + 1)
  }

  const offerLoad = offerLoadId ? loads.find((l) => l.id === offerLoadId) : null

  return (
    <div className="max-w-5xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Available shipments</h1>
          <p className="text-sm text-stone-600 mt-1">
            Fixed price — accept loads that match your capacity.
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
          Loads are filtered using your max truck capacity.
        </span>
      </div>

      {loads.length === 0 ? (
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
          {loads.map((load) => (
            <li
              key={load.id}
              className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold text-stone-800 text-lg">
                      {load.origin} → {load.destination}
                    </p>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-accent/10 text-accent border border-accent/20">
                      {load.price ?? 'Fixed price'}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-600">
                    <span>
                      Date <span className="font-semibold text-stone-800">{new Date(load.date).toLocaleDateString()}</span>
                    </span>
                    <span>
                      Weight <span className="font-semibold text-stone-800">{load.weight}</span>
                    </span>
                    <span className="text-stone-500">
                      Shipper <span className="font-semibold text-stone-700">{load.createdBy}</span>
                    </span>
                    <span className="text-stone-500">
                      Offers <span className="font-semibold text-stone-700">{load.offers?.length ?? 0}</span>
                    </span>
                  </div>
                  {load.description && (
                    <p className="text-stone-500 text-sm mt-3 line-clamp-2">
                      <span className="font-semibold text-stone-700">Cargo:</span> {load.description}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => openOfferModal(load.id)}
                  className="px-5 py-2.5 bg-accent text-white font-semibold rounded-xl hover:bg-accent-hover transition-colors shrink-0"
                >
                  Accept shipment
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {offerLoad && (
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
              Accept shipment
            </h2>
            <p className="text-sm text-stone-600 mt-1">
              {offerLoad.origin} → {offerLoad.destination} · {offerLoad.weight}
            </p>
            <div className="mt-4 rounded-2xl border border-stone-200 bg-sand p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-stone-500">Fixed price</p>
                <p className="text-sm font-semibold text-accent">
                  {offerLoad.price ?? 'Fixed price'}
                </p>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="text-xs text-stone-500">Pickup date</p>
                <p className="text-xs font-semibold text-stone-800">
                  {new Date(offerLoad.date).toLocaleDateString()}
                </p>
              </div>
            </div>
            <form onSubmit={handleSubmitOffer} className="space-y-4">
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
                  Confirm acceptance
                </button>
                <button
                  type="button"
                  onClick={closeOfferModal}
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