import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getMyTrucks, updateTruckStatus, type CompanyTruck } from '../api/companyOpsApi'
import type { ApiError } from '../api/http'

export default function CompanyTrucks() {
  const { user } = useAuth()
  const token = user?.token ?? ''
  const isVerified = String(user?.status ?? '').toUpperCase() === 'VERIFIED'

  const [trucks, setTrucks] = useState<CompanyTruck[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [refresh, setRefresh] = useState(0)

  // Form state
  const [capacity, setCapacity] = useState('')
  const [plateNumber, setPlateNumber] = useState('')
  const [truckType, setTruckType] = useState('Flatbed')
  const [insuranceCertFile, setInsuranceCertFile] = useState<File | null>(null)
  const [regCardFile, setRegCardFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await getMyTrucks(token)
      setTrucks(data)
    } catch (e) {
      setError((e as ApiError).message || 'Could not load your trucks.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [refresh])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!capacity.trim()) { setError('Enter capacity.'); return }
    if (!isVerified) { setError('Your company must be approved before adding trucks.'); return }
    if (!regCardFile) { setError('Please upload the registration card.'); return }
    if (!insuranceCertFile) { setError('Please upload the insurance certificate.'); return }

    setSubmitting(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('plate_number', plateNumber.trim() || `RAB-${Math.floor(Math.random() * 900 + 100)}-A`)
      formData.append('truck_type', truckType)
      formData.append('declared_capacity', String(Number(capacity)))
      formData.append('reg_card', regCardFile)
      formData.append('insurance_cert', insuranceCertFile)

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/trucks/register`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Could not register truck.' }))
        throw new Error(err.message || 'Could not register truck.')
      }
      setCapacity('')
      setPlateNumber('')
      setTruckType('Flatbed')
      setInsuranceCertFile(null)
      setRegCardFile(null)
      setShowForm(false)
      setRefresh(v => v + 1)
    } catch (e) {
      setError((e as ApiError).message || 'Could not add this truck.')
    } finally {
      setSubmitting(false)
    }
  }

  async function setTruckStatus(id: number, next: 'AVAILABLE' | 'UNAVAILABLE') {
    setError(null)
    try {
      await updateTruckStatus(token, String(id), next)
      setRefresh(v => v + 1)
    } catch (e) {
      setError((e as ApiError).message || 'Could not update truck status.')
    }
  }

  function renderStars(avg: number | null): string {
    if (!avg) return '—'
    const rounded = Math.round(avg)
    return '★'.repeat(rounded) + '☆'.repeat(5 - rounded)
  }

  return (
    <div className="max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">My trucks</h1>
          <p className="text-stone-600 mt-1">Add and manage your trucks. You'll use them when you show interest in shipments.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          disabled={!isVerified}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-white font-semibold rounded-xl hover:bg-accent-hover transition-all shadow-lg shadow-accent/20 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8v8m-8-8H4" />
          </svg>
          Add truck
        </button>
      </div>

      {!isVerified && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm font-semibold text-amber-900">Waiting for admin approval</p>
          <p className="text-sm text-amber-800 mt-1">Your company must be approved before you can add trucks or accept shipments.</p>
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-lg p-6 mb-8">
          <h2 className="text-lg font-bold text-stone-800 mb-4">Add a truck</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="truckType" className="block text-sm font-semibold text-stone-700 mb-2">Truck type</label>
                <select id="truckType" value={truckType} onChange={e => setTruckType(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 text-stone-800 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20">
                  {['Flatbed','Box Truck','Refrigerated','Tipper','Tanker','Dump Truck','Cargo Van'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="capacity" className="block text-sm font-semibold text-stone-700 mb-2">Capacity (kg)</label>
                <input id="capacity" type="number" min="1" placeholder="e.g. 5000"
                  value={capacity} onChange={e => setCapacity(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20" />
              </div>
            </div>
            <div>
              <label htmlFor="plate" className="block text-sm font-semibold text-stone-700 mb-2">Plate number (optional)</label>
              <input id="plate" type="text" placeholder="e.g. RAB 123 A"
                value={plateNumber} onChange={e => setPlateNumber(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20" />
            </div>
            {/* Insurance cert */}
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-2">Insurance certificate <span className="text-red-500">*</span></label>
              <label htmlFor="insuranceCert" className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 cursor-pointer hover:bg-stone-100 transition-all">
                <svg className="w-4 h-4 text-stone-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span className={`text-sm truncate ${insuranceCertFile ? 'text-stone-800' : 'text-stone-400'}`}>
                  {insuranceCertFile ? insuranceCertFile.name : 'Upload insurance certificate (PDF or image)'}
                </span>
                <input id="insuranceCert" type="file" accept=".pdf,.jpg,.jpeg,.png" className="sr-only"
                  onChange={e => setInsuranceCertFile(e.target.files?.[0] ?? null)} />
              </label>
            </div>
            {/* Reg card */}
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-2">Registration card <span className="text-red-500">*</span></label>
              <label htmlFor="regCard" className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 cursor-pointer hover:bg-stone-100 transition-all">
                <svg className="w-4 h-4 text-stone-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span className={`text-sm truncate ${regCardFile ? 'text-stone-800' : 'text-stone-400'}`}>
                  {regCardFile ? regCardFile.name : 'Upload registration card (PDF or image)'}
                </span>
                <input id="regCard" type="file" accept=".pdf,.jpg,.jpeg,.png" className="sr-only"
                  onChange={e => setRegCardFile(e.target.files?.[0] ?? null)} />
              </label>
              <p className="text-xs text-stone-400 mt-1.5">Truck will be pending admin verification before it can be used.</p>
            </div>
            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>}
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={submitting}
                className="px-5 py-2.5 bg-accent text-white font-semibold rounded-xl hover:bg-accent-hover disabled:opacity-60">
                {submitting ? 'Submitting…' : 'Submit for verification'}
              </button>
              <button type="button"
                onClick={() => { setShowForm(false); setCapacity(''); setPlateNumber(''); setTruckType('Flatbed'); setInsuranceCertFile(null); setRegCardFile(null); setError(null) }}
                className="px-5 py-2.5 bg-stone-100 text-stone-700 font-semibold rounded-xl hover:bg-stone-200">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {error && !showForm && (
        <p className="mb-6 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-7 h-7 rounded-full border-2 border-sidebar border-t-transparent animate-spin" />
        </div>
      ) : trucks.length === 0 && !showForm ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-10 text-center">
          <p className="text-stone-600 mb-4">No trucks yet. Add at least one truck to start bidding on loads.</p>
          <button type="button" onClick={() => setShowForm(true)} className="text-accent font-semibold hover:underline">
            Add your first truck
          </button>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {trucks.map(truck => (
            <li key={truck.id} className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1">
                  <p className="font-semibold text-stone-800">{truck.declared_capacity} kg</p>
                  <p className="text-stone-600 text-sm mt-1">Type: {truck.truck_type}</p>
                  <p className="text-stone-500 text-sm">Plate: {truck.plate_number}</p>

                  {/* Verification badge */}
                  {(() => {
                    const vs = truck.verification_status ?? 'PENDING'
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

                  {/* Availability */}
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-stone-600">Availability</p>
                    {truck.availability_status === 'RESERVED' || truck.availability_status === 'IN_TRANSIT' ? (
                      <span className="mt-1 inline-flex items-center rounded-full bg-stone-100 text-stone-700 border border-stone-200 px-3 py-1 text-xs font-semibold">
                        {truck.availability_status === 'RESERVED' ? 'Reserved' : 'In transit'}
                      </span>
                    ) : (
                      <div className="mt-2 flex items-center gap-2">
                        <button type="button"
                          onClick={() => setTruckStatus(truck.id, 'AVAILABLE')}
                          disabled={truck.availability_status === 'AVAILABLE'}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors disabled:opacity-60 disabled:cursor-not-allowed bg-white border-stone-200 text-stone-700 hover:border-stone-300">
                          Available
                        </button>
                        <button type="button"
                          onClick={() => setTruckStatus(truck.id, 'UNAVAILABLE')}
                          disabled={truck.availability_status === 'UNAVAILABLE'}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors disabled:opacity-60 disabled:cursor-not-allowed bg-white border-stone-200 text-stone-700 hover:border-stone-300">
                          Unavailable
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Rating */}
                  <div className="mt-3">
                    {truck.rating_average ? (
                      <span className="inline-flex items-center gap-2 rounded-full bg-stone-50 text-sidebar px-3 py-1 text-xs font-semibold border border-stone-200">
                        <span className="text-accent">{renderStars(truck.rating_average)}</span>
                        <span className="text-stone-700">{Number(truck.rating_average).toFixed(1)}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 rounded-full bg-stone-100 text-stone-700 px-3 py-1 text-xs font-semibold border border-stone-200">
                        <span className="text-stone-500">★</span>
                        No ratings yet
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
