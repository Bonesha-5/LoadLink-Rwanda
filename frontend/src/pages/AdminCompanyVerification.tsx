import { useEffect, useState } from 'react'
import { approveCompany, ensureSeedAdminData, getPendingCompanies, rejectCompany } from '../data/storage'
import { useAuth } from '../context/AuthContext'
import { approveCompanyApi, getCompanyDocsApi, getPendingCompaniesApi, rejectCompanyApi } from '../api/adminApi'
import type { ApiError } from '../api/http'
import { getApiToken } from '../auth/mockJwt'

type PendingCompany = {
  id: string
  name: string
  rdbNumber: string
  contactPerson: string
  createdAt: string
}

type FetchState = 'idle' | 'loading' | 'error' | 'success'

export default function AdminCompanyVerification() {
  const { user } = useAuth()
  const token = getApiToken(user?.token ?? null)
  const [companies, setCompanies] = useState<PendingCompany[]>([])
  const [state, setState] = useState<FetchState>('idle')
  const [error, setError] = useState<string | null>(null)

  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  async function loadCompanies() {
    setState('loading')
    setError(null)
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
        setState('success')
        return
      }

      ensureSeedAdminData()
      const data = getPendingCompanies().map((c): PendingCompany => ({
        id: c.id,
        name: c.name,
        rdbNumber: c.rdbNumber,
        contactPerson: c.contactPerson,
        createdAt: c.createdAt,
      }))
      setCompanies(data)
      setState('success')
    } catch (err) {
      console.error(err)
      setCompanies([])
      const e = err as ApiError
      setError(token ? (e.message || 'Could not load pending companies.') : 'Could not load companies from local demo data.')
      setState('error')
    }
  }

  useEffect(() => {
    void loadCompanies()
  }, [])

  function openDoc(id: string, type: 'business' | 'insurance') {
    if (!token) {
      // Fallback demo: keep existing behavior for local setups
      const url = `/api/admin/companies/${id}/docs`
      window.open(url, '_blank', 'noopener,noreferrer')
      return
    }

    void (async () => {
      try {
        const docs = await getCompanyDocsApi(token, id)
        const business = docs.business_cert_path ?? docs.businessCertPath
        const insurance = docs.insurance_doc_path ?? docs.insuranceDocPath
        const toOpen = type === 'business' ? business : insurance
        if (!toOpen) {
          alert('No document path returned for this company.')
          return
        }
        window.open(toOpen, '_blank', 'noopener,noreferrer')
      } catch (e) {
        const err = e as ApiError
        alert(err.message || 'Could not load documents.')
      }
    })()
  }

  async function approve(id: string) {
    try {
      if (token) {
        await approveCompanyApi(token, id)
      } else {
        approveCompany(id, 'Admin')
      }
      setCompanies((prev) => prev.filter((c) => c.id !== id))
    } catch (err) {
      console.error(err)
      alert('Could not approve this company. Please try again.')
    }
  }

  function startReject(id: string) {
    setRejectingId(id)
    setRejectReason('')
  }

  function closeReject() {
    setRejectingId(null)
    setRejectReason('')
  }

  async function confirmReject(e: React.FormEvent) {
    e.preventDefault()
    if (!rejectingId) return
    try {
      if (token) {
        if (!rejectReason.trim()) {
          alert('Please add a reason for rejection.')
          return
        }
        await rejectCompanyApi(token, rejectingId, rejectReason.trim())
      } else {
        rejectCompany(rejectingId, rejectReason || undefined, 'Admin')
      }
      setCompanies((prev) => prev.filter((c) => c.id !== rejectingId))
      closeReject()
    } catch (err) {
      console.error(err)
      alert('Could not reject this company. Please try again.')
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Company checks</h1>
          <p className="text-sm text-stone-600 mt-1">
            Check documents, then approve or reject the company request.
          </p>
        </div>
        <button
          type="button"
          onClick={loadCompanies}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-600 hover:text-stone-900 hover:underline"
        >
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
          Refresh
        </button>
      </div>

      <div className="flex items-center gap-3 text-xs text-stone-600">
        <span className="inline-flex items-center gap-2 rounded-full bg-cream px-3 py-1 border border-stone-200">
          <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
          <span className="font-semibold text-stone-800">
            {companies.length}
          </span>
          <span className="text-stone-600">
            company{companies.length === 1 ? '' : 'ies'} awaiting verification
          </span>
        </span>
        <span className="hidden sm:inline text-stone-500">
          Open the documents to confirm they are valid.
        </span>
      </div>

      {state === 'loading' && (
        <p className="text-stone-500 text-sm">Loading pending companies…</p>
      )}

      {state === 'error' && error && (
        <p className="text-red-600 text-sm mb-4">{error}</p>
      )}

      {state === 'success' && error && (
        <p className="text-amber-600 text-xs mb-3">{error}</p>
      )}

      {state === 'success' && companies.length === 0 && (
        <div className="bg-white border border-stone-200 rounded-3xl p-10 text-center shadow-sm">
          <p className="text-stone-600">
            There are no companies waiting for verification right now.
          </p>
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
                  <td className="px-4 py-3">
                    <p className="font-semibold text-stone-800">{company.name}</p>
                  </td>
                  <td className="px-4 py-3 text-stone-700">{company.rdbNumber}</td>
                  <td className="px-4 py-3 text-stone-700">{company.contactPerson}</td>
                  <td className="px-4 py-3 text-stone-500 text-xs">
                    {new Date(company.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openDoc(company.id, 'business')}
                        className="px-2 py-1 text-xs font-semibold text-sidebar bg-cream rounded-lg hover:bg-stone-100"
                      >
                        Business certificate
                      </button>
                      <button
                        type="button"
                        onClick={() => openDoc(company.id, 'insurance')}
                        className="px-2 py-1 text-xs font-semibold text-sidebar bg-cream rounded-lg hover:bg-stone-100"
                      >
                        Insurance document
                      </button>
                      <button
                        type="button"
                        onClick={() => approve(company.id)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-accent text-white hover:bg-accent-hover shadow-sm"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => startReject(company.id)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                      >
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

      {rejectingId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 px-4"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-stone-800 mb-2">Reject company</h2>
            <p className="text-sm text-stone-600 mb-4">
              Optionally provide a reason for rejecting this company.
            </p>
            <form onSubmit={confirmReject} className="space-y-4">
              <div>
                <label
                  htmlFor="reject-reason"
                  className="block text-sm font-semibold text-stone-700 mb-2"
                >
                  Reason (optional)
                </label>
                <textarea
                  id="reject-reason"
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 resize-none"
                  placeholder="e.g. Missing valid insurance documents"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeReject}
                  className="px-4 py-2 text-sm font-semibold rounded-xl bg-stone-100 text-stone-700 hover:bg-stone-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold rounded-xl bg-red-600 text-white hover:bg-red-700"
                >
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