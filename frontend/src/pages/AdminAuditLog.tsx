import { useEffect, useMemo, useState } from 'react'
import { ensureSeedAdminData, getAuditLogs } from '../data/storage'
import { useAuth } from '../context/AuthContext'
import { getAdminAuditApi, type AuditEntryDto } from '../api/adminOpsApi'
import type { ApiError } from '../api/http'
import { getApiToken } from '../auth/mockJwt'

type AuditEntry = {
  id: string
  timestamp: string
  adminName: string
  action: string
  targetType: string
  targetId: string
}

type FetchState = 'idle' | 'loading' | 'error' | 'success'

function parseActionKey(raw: string): { key: string; detail?: string } {
  if (raw.startsWith('COMPANY_REJECTED:')) {
    return { key: 'COMPANY_REJECTED', detail: raw.slice('COMPANY_REJECTED:'.length) }
  }
  return { key: raw }
}

function formatAction(action: string): string {
  const { key, detail } = parseActionKey(action)
  const map: Record<string, string> = {
    SEED_DATA: 'Demo data initialized',
    COMPANY_APPROVED: 'Company verified',
    COMPANY_REJECTED: 'Company application rejected',
    DISPUTE_RESOLVED: 'Dispute closed (payment released)',
  }
  if (key === 'COMPANY_REJECTED' && detail) {
    return `Company rejected${detail ? ` · ${detail}` : ''}`
  }
  return (
    map[key] ??
    key
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/^\w/, (c) => c.toUpperCase())
  )
}

export default function AdminAuditLog() {
  const { user } = useAuth()
  const token = getApiToken(user?.token ?? null)
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [state, setState] = useState<FetchState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [scope, setScope] = useState<'all' | 'company' | 'shipment'>('all')

  async function loadAuditLog() {
    setState('loading')
    setError(null)
    try {
      if (token) {
        const apiData = await getAdminAuditApi(token)
        const data = apiData.map(
          (e: AuditEntryDto): AuditEntry => ({
            id: String(e.id),
            timestamp: e.createdAt ?? e.created_at ?? new Date().toISOString(),
            adminName: e.adminName ?? e.admin_name ?? 'Admin',
            action: e.action,
            targetType: e.targetType ?? e.target_type ?? '—',
            targetId: e.targetId ?? e.target_id ?? '—',
          }),
        )
        setEntries(data)
        setState('success')
        return
      }

      ensureSeedAdminData()
      const data = getAuditLogs().map((e): AuditEntry => ({
        id: e.id,
        timestamp: e.createdAt,
        adminName: e.adminName,
        action: e.action,
        targetType: e.targetType,
        targetId: e.targetId,
      }))
      setEntries(data)
      setState('success')
    } catch (err) {
      console.error(err)
      setEntries([])
      const e = err as ApiError
      setError(token ? (e.message || 'Could not load audit entries.') : 'Could not load audit entries from local demo data.')
      setState('error')
    }
  }

  useEffect(() => {
    void loadAuditLog()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return entries.filter((e) => {
      if (scope === 'company' && e.targetType.toLowerCase() !== 'company') return false
      if (scope === 'shipment' && e.targetType.toLowerCase() !== 'shipment') return false
      if (!q) return true
      const hay = `${e.adminName} ${e.action} ${e.targetId} ${formatAction(e.action)}`.toLowerCase()
      return hay.includes(q)
    })
  }, [entries, query, scope])

  const rows = useMemo(() => {
    return filtered
      .slice()
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }, [filtered])

  // KPI summary cards were removed to keep this page focused.

  return (
    <div className="space-y-8 ll-animate-in max-w-4xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Admin</p>
          <h1 className="text-2xl font-bold text-stone-900 mt-1">Activity log</h1>
          <p className="text-sm text-stone-600 mt-1 max-w-xl">
            A simple history of admin actions — who did what, and when.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadAuditLog()}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-sidebar text-white text-sm font-semibold hover:bg-stone-800 transition-colors shadow-sm border border-stone-800"
        >
          <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-3 flex items-center text-stone-400 pointer-events-none">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
            </svg>
          </span>
          <input
            type="search"
            placeholder="Search admin, action, or ID…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-stone-200 bg-white text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(['all', 'company', 'shipment'] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setScope(key)}
              className={[
                'px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border',
                scope === key
                  ? 'bg-accent text-sidebar border-accent'
                  : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300',
              ].join(' ')}
            >
              {key === 'all' ? 'All' : key === 'company' ? 'Companies' : 'Shipments'}
            </button>
          ))}
        </div>
      </div>

      {state === 'loading' && (
        <div className="flex items-center gap-3 text-stone-500 text-sm py-8">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          Loading audit trail…
        </div>
      )}

      {state === 'error' && error && (
        <p className="text-red-600 text-sm rounded-2xl border border-red-100 bg-red-50 px-4 py-3">{error}</p>
      )}

      {state === 'success' && filtered.length === 0 && (
        <div className="rounded-3xl border border-dashed border-stone-200 bg-stone-50/80 p-12 text-center">
          <p className="text-stone-700 font-semibold">No results</p>
          <p className="text-sm text-stone-500 mt-2">Try a different search or filter.</p>
        </div>
      )}

      {state === 'success' && filtered.length > 0 && (
        <div className="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="px-4 py-3 font-semibold text-stone-700">Date / time</th>
                <th className="px-4 py-3 font-semibold text-stone-700">Admin</th>
                <th className="px-4 py-3 font-semibold text-stone-700">Action</th>
                <th className="px-4 py-3 font-semibold text-stone-700">Target type</th>
                <th className="px-4 py-3 font-semibold text-stone-700">Target ID</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => (
                <tr key={e.id} className="border-b border-stone-100 last:border-0">
                  <td className="px-4 py-3 text-xs text-stone-500">
                    {new Date(e.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-stone-800">{e.adminName}</td>
                  <td className="px-4 py-3 text-stone-800 font-semibold">{formatAction(e.action)}</td>
                  <td className="px-4 py-3 text-stone-700">{e.targetType}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-stone-700">{e.targetId}</span>
                      <button
                        type="button"
                        className="text-xs font-semibold text-stone-500 hover:text-accent hover:underline underline-offset-2"
                        onClick={() => void navigator.clipboard.writeText(e.targetId)}
                      >
                        Copy
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-stone-500 border-t border-stone-200 pt-6">
        Demo data (local only).
      </p>
    </div>
  )
}
