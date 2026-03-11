import { useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  getAllLoads,
  addOfferToLoad,
  ensureSeedLoads,
} from '../data/storage'

export default function CompanyShipments() {
  const { user } = useAuth()
  const companyName = user?.name ?? ''
  const [refresh, setRefresh] = useState(0)
  const [offerLoadId, setOfferLoadId] = useState<string | null>(null)
  const [offerAmount, setOfferAmount] = useState('')
  const [offerMessage, setOfferMessage] = useState('')

  const loads = useMemo(() => {
    void refresh
    ensureSeedLoads()
    return getAllLoads().filter((l) => l.status === 'open')
  }, [refresh])

  function openOfferModal(loadId: string) {
    setOfferLoadId(loadId)
    setOfferAmount('')
    setOfferMessage('')
  }

  function closeOfferModal() {
    setOfferLoadId(null)
    setOfferAmount('')
    setOfferMessage('')
  }

  function handleSubmitOffer(e: React.FormEvent) {
    e.preventDefault()
    if (!offerLoadId || !offerAmount.trim()) return
    addOfferToLoad(offerLoadId, companyName, offerAmount.trim(), offerMessage.trim() || undefined)
    closeOfferModal()
    setRefresh((v) => v + 1)
  }

  const offerLoad = offerLoadId ? loads.find((l) => l.id === offerLoadId) : null

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-800">Available shipments</h1>
        <p className="text-stone-600 mt-1">Browse loads posted by shippers and submit your offer.</p>
      </div>

      {loads.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-10 text-center">
          <p className="text-stone-600">No open shipments at the moment. Check back later.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {loads.map((load) => (
            <li
              key={load.id}
              className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-bold text-stone-800 text-lg">{load.origin} → {load.destination}</p>
                  <p className="text-stone-600 text-sm mt-1">Date: {load.date} · {load.weight}</p>
                  {load.description && (
                    <p className="text-stone-500 text-sm mt-2">{load.description}</p>
                  )}
                  <p className="text-stone-500 text-sm mt-1">Posted by {load.createdBy}</p>
                  {load.offers && load.offers.length > 0 && (
                    <p className="text-stone-500 text-sm mt-1">{load.offers.length} offer(s) received</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => openOfferModal(load.id)}
                  className="px-5 py-2.5 bg-accent text-white font-semibold rounded-xl hover:bg-accent-hover transition-colors shrink-0"
                >
                  Submit offer
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {offerLoad && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50"
          onClick={closeOfferModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="offer-modal-title"
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="offer-modal-title" className="text-lg font-bold text-stone-800 mb-2">
              Submit offer — {offerLoad.origin} → {offerLoad.destination}
            </h2>
            <p className="text-stone-600 text-sm mb-4">{offerLoad.weight} · {offerLoad.date}</p>
            <form onSubmit={handleSubmitOffer} className="space-y-4">
              <div>
                <label htmlFor="offer-amount" className="block text-sm font-semibold text-stone-700 mb-2">Your price (RWF)</label>
                <input
                  id="offer-amount"
                  type="text"
                  placeholder="e.g. 150000"
                  value={offerAmount}
                  onChange={(e) => setOfferAmount(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </div>
              <div>
                <label htmlFor="offer-message" className="block text-sm font-semibold text-stone-700 mb-2">Message (optional)</label>
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
                  Submit offer
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