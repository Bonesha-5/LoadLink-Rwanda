import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { apiRequest } from '../api/http'
import type { ApiError } from '../api/http'

type AuditEntry = {
  id: string
  action: string
  target_type: string
  target_id: string
  created_at: string
  admin_name: string
  admin_email: string
}

const ACTION_COLORS: Record<string, string> = {
  COMPANY_APPROVED:     'bg-emerald-100 text-emerald-700',
  COMPANY_REJECTED:     'bg-red-100 text-red-700',
  TRUCK_APPROVED:       'bg-blue-100 text-blue-700',
  TRUCK_REJECTED:       'bg-red-100 text-red-700',
  USER_SUSPENDED:       'bg-amber-100 text-amber-700',
  USER_REINSTATED:      'bg-emerald-100 text-emerald-700',
  DISPUTE_RESOLVED_FULL_RELEASE: 'bg-stone-100 text-stone-700',
  DISPUTE_RESOLVED_FULL_REFUND:  'bg-stone-100 text-stone-700',
  DISPUTE_RESOLVED_SPLIT:        'bg-stone-100 text-stone-700',
}

export default function AdminAuditLog() {
  const { user } = useAuth()
  const token = user?.token ?? ''

  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await apiRequest<AuditEntry[]>('/api/admin/audit', { token })
      setEntries(data)
    } catch (e) {
      setError((e as ApiError).message || 'Could not load audit log.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Audit Log</h1>
          <p className="text-sm text-stone-600 mt-1">All admin actions recorded for accountability.</p>
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

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-7 h-7 rounded-full border-2 border-sidebar border-t-transparent animate-spin" />
        </div>
      ) : entries.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-3xl p-10 text-center shadow-sm">
          <p className="text-stone-500 text-sm">No audit entries yet.</p>
        </div>
      ) : (
        <div className="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="px-4 py-3 font-semibold text-stone-700">Action</th>
                <th className="px-4 py-3 font-semibold text-stone-700">Target</th>
                <th className="px-4 py-3 font-semibold text-stone-700">Admin</th>
                <th className="px-4 py-3 font-semibold text-stone-700">Date</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(e => (
                <tr key={e.id} className="border-b border-stone-100 last:border-0 hover:bg-stone-50">
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ACTION_COLORS[e.action] ?? 'bg-stone-100 text-stone-600'}`}>
                      {e.action.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-stone-700">
                    <span className="font-semibold capitalize">{e.target_type}</span>
                    <span className="text-xs text-stone-400 ml-2 font-mono">{String(e.target_id).slice(0, 10)}…</span>
                  </td>
                  <td className="px-4 py-3 text-stone-700">
                    <p className="font-semibold">{e.admin_name}</p>
                    <p className="text-xs text-stone-400">{e.admin_email}</p>
                  </td>
                  <td className="px-4 py-3 text-stone-500 text-xs">
                    {new Date(e.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
