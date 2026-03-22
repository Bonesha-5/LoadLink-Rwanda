import { useEffect, useMemo, useState } from 'react'
import { ensureSeedAdminData, getAuditLogs } from '../data/storage'

type AuditEntry = {
  id: string
  timestamp: string
  adminName: string
  action: string
  targetType: string
  targetId: string
}

type FetchState = 'idle' | 'loading' | 'error' | 'success'

type ActionKind = 'success' | 'warning' | 'dispute' | 'system' | 'neutral'

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
    DISPUTE_RESOLVED: 'Dispute closed & escrow released',
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

function actionKind(action: string): ActionKind {
  const { key } = parseActionKey(action)
  if (key === 'COMPANY_APPROVED') return 'success'
  if (key === 'COMPANY_REJECTED') return 'warning'
  if (key.includes('DISPUTE')) return 'dispute'
  if (key === 'SEED_DATA' || key.includes('SEED')) return 'system'
  return 'neutral'
}

function humanTargetLabel(targetType: string, targetId: string): string {
  const t = targetType.toLowerCase()
  if (targetId === 'SYSTEM') {
    return 'Platform (system)'
  }
  if (t === 'company') {
    return `Company · ${targetId}`
  }
  if (t === 'shipment') {
    return `Shipment · ${targetId}`
  }
  if (t === 'user') {
    return `User · ${targetId}`
  }
  return `${targetType} · ${targetId}`
}

function relativeTime(iso: string): string {
  const d = new Date(iso)
  const now = Date.now()
  const diff = now - d.getTime()
  const mins = Math.floor(diff / 60_000)
  const hrs = Math.floor(diff / 3_600_000)
  const days = Math.floor(diff / 86_400_000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  if (hrs < 24) return `${hrs}h ago`
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function calendarDayKey(iso: string): string {
  return new Date(iso).toDateString()
}

function formatDayHeading(iso: string): string {
  const d = new Date(iso)
  const today = new Date().toDateString()
  const y = new Date()
  y.setDate(y.getDate() - 1)
  if (d.toDateString() === today) return 'Today'
  if (d.toDateString() === y.toDateString()) return 'Yesterday'
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

function ActionIcon({ kind }: { kind: ActionKind }) {
  const stroke = 'currentColor'
  if (kind === 'success') {
    return (
      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/15 text-accent border border-accent/25">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke={stroke} strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </span>
    )
  }
  if (kind === 'warning') {
    return (
      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-stone-900 text-accent border border-stone-700">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke={stroke} strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </span>
    )
  }
  if (kind === 'dispute') {
    return (
      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/10 text-sidebar border border-accent/20">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke={stroke} strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </span>
    )
  }
  if (kind === 'system') {
    return (
      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-stone-100 text-stone-600 border border-stone-200">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke={stroke} strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
        </svg>
      </span>
    )
  }
  return (
    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-stone-50 text-stone-700 border border-stone-200">
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke={stroke} strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </span>
  )
}

export default function AdminAuditLog() {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [state, setState] = useState<FetchState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [scope, setScope] = useState<'all' | 'company' | 'shipment'>('all')

  async function loadAuditLog() {
    setState('loading')
    setError(null)
    try {
      ensureSeedAdminData()
      const data = getAuditLogs().map(
        (e): AuditEntry => ({
          id: e.id,
          timestamp: e.createdAt,
          adminName: e.adminName,
          action: e.action,
          targetType: e.targetType,
          targetId: e.targetId,
        }),
      )
      setEntries(data)
      setState('success')
    } catch (err) {
      console.error(err)
      setEntries([])
      setError('Could not load audit entries from local demo data.')
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

  const groupedByDay = useMemo(() => {
    const map = new Map<string, AuditEntry[]>()
    for (const e of filtered) {
      const k = calendarDayKey(e.timestamp)
      const arr = map.get(k) ?? []
      arr.push(e)
      map.set(k, arr)
    }
    return Array.from(map.entries()).sort(
      (a, b) => new Date(b[1][0].timestamp).getTime() - new Date(a[1][0].timestamp).getTime(),
    )
  }, [filtered])

  const totalEntries = entries.length
  const weekAgo = Date.now() - 7 * 86_400_000
  const last7 = entries.filter((e) => new Date(e.timestamp).getTime() >= weekAgo).length
  const companyTouches = entries.filter((e) => e.targetType.toLowerCase() === 'company').length

  return (
    <div className="space-y-8 ll-animate-in max-w-4xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Compliance & oversight</p>
          <h1 className="text-2xl font-bold text-stone-900 mt-1">Audit log</h1>
          <p className="text-sm text-stone-600 mt-1 max-w-xl">
            Every important admin action is recorded here so you can trace who did what, and when — for disputes,
            verifications, and platform events.
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

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-stone-500">Total events</p>
          <p className="mt-2 text-3xl font-bold text-stone-900 tabular-nums">{totalEntries}</p>
          <p className="mt-1 text-xs text-stone-500">Stored in this browser (demo)</p>
        </div>
        <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm ring-1 ring-accent/10">
          <p className="text-xs font-semibold text-stone-500">Last 7 days</p>
          <p className="mt-2 text-3xl font-bold text-accent tabular-nums">{last7}</p>
          <p className="mt-1 text-xs text-stone-500">Recent activity</p>
        </div>
        <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-stone-500">Company actions</p>
          <p className="mt-2 text-3xl font-bold text-stone-900 tabular-nums">{companyTouches}</p>
          <p className="mt-1 text-xs text-stone-500">Approvals & rejections</p>
        </div>
      </section>

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
        <div className="space-y-10">
          {groupedByDay.map(([dayKey, dayEntries]) => (
            <section key={dayKey}>
              <h2 className="text-sm font-bold text-stone-900 mb-4 flex items-center gap-2">
                <span className="h-px flex-1 bg-stone-200 max-w-[120px]" />
                {formatDayHeading(dayEntries[0].timestamp)}
                <span className="h-px flex-1 bg-stone-200" />
              </h2>
              <div className="relative pl-2 sm:pl-0">
                <div className="absolute left-[27px] top-3 bottom-3 w-px bg-gradient-to-b from-accent/30 via-stone-200 to-transparent hidden sm:block" aria-hidden />
                <ul className="space-y-4">
                  {dayEntries.map((e) => {
                    const kind = actionKind(e.action)
                    return (
                      <li key={e.id} className="relative flex gap-4 sm:gap-5">
                        <div className="shrink-0 pt-1 z-10">
                          <ActionIcon kind={kind} />
                        </div>
                        <div className="flex-1 min-w-0 rounded-3xl border border-stone-200 bg-white p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <p className="font-semibold text-stone-900">{formatAction(e.action)}</p>
                              <p className="text-sm text-stone-600 mt-1">
                                <span className="font-medium text-stone-800">{e.adminName}</span>
                                <span className="text-stone-400 mx-1.5">·</span>
                                {humanTargetLabel(e.targetType, e.targetId)}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-xs font-semibold text-accent">{relativeTime(e.timestamp)}</p>
                              <p className="text-[11px] text-stone-400 mt-0.5" title={new Date(e.timestamp).toISOString()}>
                                {new Date(e.timestamp).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="mt-4 flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-mono text-stone-600 border border-stone-200">
                              ID {e.id}
                            </span>
                            <button
                              type="button"
                              className="text-[11px] font-semibold text-stone-500 hover:text-accent underline-offset-2 hover:underline"
                              onClick={() => {
                                void navigator.clipboard.writeText(e.targetId)
                              }}
                            >
                              Copy target
                            </button>
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </section>
          ))}
        </div>
      )}

      <p className="text-xs text-stone-500 border-t border-stone-200 pt-6">
        Demo mode: entries are stored in your browser only. In production, this log would be append-only and backed by a
        secure server.
      </p>
    </div>
  )
}
