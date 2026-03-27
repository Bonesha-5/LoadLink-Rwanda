import { useEffect, useState } from 'react'
import { approveCompany, ensureSeedAdminData, getPendingCompanies, rejectCompany } from '../data/storage'
import { useAuth } from '../context/AuthContext'
import { approveCompanyApi, getCompanyDocsApi, getPendingCompaniesApi, rejectCompanyApi } from '../api/adminApi'
import { apiRequest } from '../api/http'
import type { ApiError } from '../api/http'
import { getApiToken } from '../auth/mockJwt'

type Tab = 'companies' | 'trucks'

type PendingCompany = {
  id: string
  name: string
  rdbNumber: string
  contactPerson: string
  createdAt: string
}

type PendingTruck = {
  id: string
  plateNumber: string
  truckType: string
  declaredCapacity: number
  companyName: string
  companyId: string
  insuranceCertPath: string | null
  createdAt: string
}

type FetchState = 'idle' | 'loading' | 'error' | 'success'

// ── Demo seed for pending trucks ────────────────────────────────
const DEMO_PENDING_TRUCKS: PendingTruck[] = [
  {
    id: 'TRK-PENDING-001',
    plateNumber: 'RAB 999 X',
    truckType: 'Flatbed',
    declaredCapacity: 12,
    companyName: 'Kigali Freight Ltd',
    companyId: 'company-user-1',
    insuranceCertPath: 'uploads/insurance_RAB999X.pdf',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'TRK-PENDING-002',
    plateNumber: 'RAC 888 Y',
    truckType: 'Refrigerated',
    declaredCapacity: 8,
    companyName: 'Northern Transport',
    companyId: 'company-user-3',
    insuranceCertPath: 'uploads/insurance_RAC888Y.pdf',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

export default function AdminCompanyVerification() {
  const { user } = useAuth()
  const token = getApiToken(user?.token ?? null)
  const adminName = user?.name ?? 'Admin'

  const [tab, setTab] = useState<Tab>('companies')

  // ── Companies state ─────────────────────────────────────────
  const [companies, setCompanies]         = useState<PendingCompany[]>([])
  const [companiesState, setCompaniesState] = useState<FetchState>('idle')
  const [companiesError, setCompaniesError] = useState<string | null>(null)
  const [rejectingId, setRejectingId]     = useState<string | null>(null)
  const [rejectReason, setRejectReason]   = useState('')

  // ── Trucks state ────────────────────────────────────────────
  const [trucks, setTrucks]         = useState<PendingTruck[]>([])
  const [trucksState, setTrucksState] = useState<FetchState>('idle')
  const [trucksError, setTrucksError] = useState<string | null>(null)
  const [rejectingTruckId, setRejectingTruckId] = useState<string | null>(null)
  const [truckRejectReason, setTruckRejectReason] = useState('')

  // ── Load companies ──────────────────────────────────────────
  async function loadCompanies() {
    setCompaniesState('loading')
    setCompaniesError(null)
    try {
      if (token) {
        const data = (await getPendingCompaniesApi(token)).map(
          (c): PendingCompany => ({
            id: c.id,
            name: c.name,
            rdbNumber: c.rdbNumber ?? c.rdb_number ?? '—',
            contactPerson: c.contactPerson ?? c.contact_person ?? '—',
            createdAt: c.createdAt ?? c.created_at ?? new Date().toISOString(),
          }),
        )
        setCompanies(data)
      } else {
        ensureSeedAdminData()
        setCompanies(getPendingCompanies().map((c): PendingCompany => ({
          id: c.id, name: c.name, rdbNumber: c.rdbNumber,
          contactPerson: c.contactPerson, createdAt: c.createdAt,
        })))
      }
      setCompaniesState('success')
    } catch (err) {
      setCompaniesError((err as ApiError).message || 'Could not load pending companies.')
      setCompaniesState('error')
    }
  }

  // ── Load trucks ─────────────────────────────────────────────
  async function loadTrucks() {
    setTrucksState('loading')
    setTrucksError(null)
    try {
      if (token) {
        const data = await apiRequest<PendingTruck[]>('/api/admin/trucks/pending', { token })
        setTrucks(data)
      } else {
        // Demo: use seed
        setTrucks(DEMO_PENDING_TRUCKS)
      }
      setTrucksState('success')
    } catch (err) {
      setTrucksError((err as ApiError).message || 'Could not load pending trucks.')
      setTrucksState('error')
    }
  }

  useEffect(() => { void loadCompanies(); void loadTrucks() }, [])

  // ── Company actions ─────────────────────────────────────────
  function openDoc(id: string, type: 'business' | 'insurance') {
    if (!token) {
      window.open(`/api/admin/companies/${id}/docs`, '_blank', 'noopener,noreferrer')
      return
    }
    void (async () => {
      try {
        const docs = await getCompanyDocsApi(token, id)
        const path = type === 'business'
          ? (docs.business_cert_path ?? docs.businessCertPath)
          : (docs.insurance_doc_path ?? docs.insuranceDocPath)
        if (!path) { alert('No document path returned.'); return }
        window.open(path, '_blank', 'noopener,noreferrer')
      } catch (e) {
        alert((e as ApiError).message || 'Could not load documents.')
      }
    })()
  }

  async function approveCompanyAction(id: string) {
    try {
      if (token) await approveCompanyApi(token, id)
      else approveCompany(id, adminName)
      setCompanies((prev) => prev.filter((c) => c.id !== id))
    } catch { alert('Could not approve. Please try again.') }
  }

  async function confirmRejectCompany(e: React.FormEvent) {
    e.preventDefault()
    if (!rejectingId) return
    try {
      if (token) {
        if (!rejectReason.trim()) { alert('Please add a reason.'); return }
        await rejectCompanyApi(token, rejectingId, rejectReason.trim())
      } else {
        rejectCompany(rejectingId, rejectReason || undefined, adminName)
      }
      setCompanies((prev) => prev.filter((c) => c.id !== rejectingId))
      setRejectingId(null)
      setRejectReason('')
    } catch { alert('Could not reject. Please try again.') }
  }

  // ── Truck actions ───────────────────────────────────────────
  function openTruckDoc(truck: PendingTruck) {
    if (!truck.insuranceCertPath) { alert('No insurance certificate uploaded.'); return }
    if (token) {
      window.open(truck.insuranceCertPath, '_blank', 'noopener,noreferrer')
    } else {
      alert(`Demo: would open ${truck.insuranceCertPath}`)
    }
  }

  async function approveTruck(id: string) {
    try {
      if (token) {
        await apiRequest(`/api/admin/trucks/${id}/approve`, { method: 'PATCH', token })
      }
      setTrucks((prev) => prev.filter((t) => t.id !== id))
    } catch { alert('Could not approve truck. Please try again.') }
  }

  async function confirmRejectTruck(e: React.FormEvent) {
    e.preventDefault()
    if (!rejectingTruckId) return
    try {
      if (token) {
        if (!truckRejectReason.trim()) { alert('Please add a reason.'); return }
        await apiRequest(`/api/admin/trucks/${rejectingTruckId}/reject`, {
          method: 'PATCH', token, body: { reason: truckRejectReason.trim() }
        })
      }
      setTrucks((prev) => prev.filter((t) => t.id !== rejectingTruckId))
      setRejectingTruckId(null)
      setTruckRejectReason('')
    } catch { alert('Could not reject truck. Please try again.') }
  }

  const rejectingCompany = companies.find((c) => c.id === rejectingId) ?? null
  const rejectingTruck   = trucks.find((t) => t.id === rejectingTruckId) ?? null

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Verification</h1>
          <p className="text-sm text-stone-600 mt-1">
            Review documents and approve or reject companies and trucks.
          </p>
        </div>
        <button
          type="button"
          onClick={() => { void loadCompanies(); void loadTrucks() }}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-600 hover:text-stone-900 hover:underline"
        >
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab('companies')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
            tab === 'companies' ? 'bg-sidebar text-white border-sidebar' : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
          }`}
        >
          Companies
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${tab === 'companies' ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-500'}`}>
            {companies.length}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setTab('trucks')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
            tab === 'trucks' ? 'bg-sidebar text-white border-sidebar' : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
          }`}
        >
          Trucks
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${tab === 'trucks' ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-500'}`}>
            {trucks.length}
          </span>
        </button>
      </div>

      {/* ── COMPANIES TAB ──────────────────────────────────────── */}
      {tab === 'companies' && (
        <>
          {companiesState === 'loading' && <p className="text-stone-500 text-sm">Loading…</p>}
          {companiesState === 'error' && companiesError && <p className="text-red-600 text-sm">{companiesError}</p>}

          {companiesState === 'success' && companies.length === 0 && (
            <div className="bg-white border border-stone-200 rounded-3xl p-10 text-center shadow-sm">
              <p className="text-stone-500 text-sm">No companies waiting for verification.</p>
            </div>
          )}

          {companies.length > 0 && (
            <div className="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-sm">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-stone-50 border-b border-stone-200">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-stone-700">Company</th>
                    <th className="px-4 py-3 font-semibold text-stone-700">RDB Number</th>
                    <th className="px-4 py-3 font-semibold text-stone-700">Contact</th>
                    <th className="px-4 py-3 font-semibold text-stone-700">Submitted</th>
                    <th className="px-4 py-3 font-semibold text-stone-700 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map((company) => (
                    <tr key={company.id} className="border-b border-stone-100 last:border-0">
                      <td className="px-4 py-3 font-semibold text-stone-800">{company.name}</td>
                      <td className="px-4 py-3 text-stone-700">{company.rdbNumber}</td>
                      <td className="px-4 py-3 text-stone-700">{company.contactPerson}</td>
                      <td className="px-4 py-3 text-stone-500 text-xs">{new Date(company.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap justify-end gap-2">
                          <button type="button" onClick={() => openDoc(company.id, 'business')}
                            className="px-2 py-1 text-xs font-semibold text-sidebar bg-cream rounded-lg hover:bg-stone-100">
                            Business cert
                          </button>
                          <button type="button" onClick={() => openDoc(company.id, 'insurance')}
                            className="px-2 py-1 text-xs font-semibold text-sidebar bg-cream rounded-lg hover:bg-stone-100">
                            Insurance doc
                          </button>
                          <button type="button" onClick={() => approveCompanyAction(company.id)}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-accent text-white hover:bg-accent-hover shadow-sm">
                            Approve
                          </button>
                          <button type="button" onClick={() => { setRejectingId(company.id); setRejectReason('') }}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100">
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ── TRUCKS TAB ─────────────────────────────────────────── */}
      {tab === 'trucks' && (
        <>
          {trucksState === 'loading' && <p className="text-stone-500 text-sm">Loading…</p>}
          {trucksState === 'error' && trucksError && <p className="text-red-600 text-sm">{trucksError}</p>}

          {trucksState === 'success' && trucks.length === 0 && (
            <div className="bg-white border border-stone-200 rounded-3xl p-10 text-center shadow-sm">
              <p className="text-stone-500 text-sm">No trucks waiting for verification.</p>
            </div>
          )}

          {trucks.length > 0 && (
            <div className="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-sm">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-stone-50 border-b border-stone-200">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-stone-700">Plate</th>
                    <th className="px-4 py-3 font-semibold text-stone-700">Type</th>
                    <th className="px-4 py-3 font-semibold text-stone-700">Capacity</th>
                    <th className="px-4 py-3 font-semibold text-stone-700">Company</th>
                    <th className="px-4 py-3 font-semibold text-stone-700">Submitted</th>
                    <th className="px-4 py-3 font-semibold text-stone-700 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {trucks.map((truck) => (
                    <tr key={truck.id} className="border-b border-stone-100 last:border-0">
                      <td className="px-4 py-3 font-semibold text-stone-800 font-mono">{truck.plateNumber}</td>
                      <td className="px-4 py-3 text-stone-700">{truck.truckType}</td>
                      <td className="px-4 py-3 text-stone-700">{truck.declaredCapacity} tons</td>
                      <td className="px-4 py-3 text-stone-700">{truck.companyName}</td>
                      <td className="px-4 py-3 text-stone-500 text-xs">{new Date(truck.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap justify-end gap-2">
                          <button type="button" onClick={() => openTruckDoc(truck)}
                            className="px-2 py-1 text-xs font-semibold text-sidebar bg-cream rounded-lg hover:bg-stone-100">
                            Insurance cert
                          </button>
                          <button type="button" onClick={() => approveTruck(truck.id)}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-accent text-white hover:bg-accent-hover shadow-sm">
                            Approve
                          </button>
                          <button type="button" onClick={() => { setRejectingTruckId(truck.id); setTruckRejectReason('') }}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100">
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ── Reject company modal ────────────────────────────────── */}
      {rejectingCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 px-4" role="dialog" aria-modal="true">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-stone-800 mb-1">Reject {rejectingCompany.name}</h2>
            <p className="text-sm text-stone-600 mb-4">Provide a reason for rejection.</p>
            <form onSubmit={confirmRejectCompany} className="space-y-4">
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 resize-none"
                placeholder="e.g. Missing valid insurance documents"
              />
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setRejectingId(null)}
                  className="px-4 py-2 text-sm font-semibold rounded-xl bg-stone-100 text-stone-700 hover:bg-stone-200">
                  Cancel
                </button>
                <button type="submit"
                  className="px-4 py-2 text-sm font-semibold rounded-xl bg-red-600 text-white hover:bg-red-700">
                  Confirm reject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Reject truck modal ──────────────────────────────────── */}
      {rejectingTruck && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 px-4" role="dialog" aria-modal="true">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-stone-800 mb-1">Reject truck {rejectingTruck.plateNumber}</h2>
            <p className="text-sm text-stone-600 mb-1">Company: {rejectingTruck.companyName}</p>
            <p className="text-sm text-stone-600 mb-4">Provide a reason for rejection.</p>
            <form onSubmit={confirmRejectTruck} className="space-y-4">
              <textarea
                rows={3}
                value={truckRejectReason}
                onChange={(e) => setTruckRejectReason(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 resize-none"
                placeholder="e.g. Insurance certificate is expired"
              />
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setRejectingTruckId(null)}
                  className="px-4 py-2 text-sm font-semibold rounded-xl bg-stone-100 text-stone-700 hover:bg-stone-200">
                  Cancel
                </button>
                <button type="submit"
                  className="px-4 py-2 text-sm font-semibold rounded-xl bg-red-600 text-white hover:bg-red-700">
                  Confirm reject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
