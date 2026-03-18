import { useEffect, useState } from 'react'
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

export default function AdminAuditLog() {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [state, setState] = useState<FetchState>('idle')
  const [error, setError] = useState<string | null>(null)

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
          targetType: e.targetType.toUpperCase(),
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

  const totalEntries = entries.length
  const today = new Date().toDateString()
  const todayCount = entries.filter((e) => new Date(e.timestamp).toDateString() === today).length

  function formatAction(action: string) {
    switch (action) {
      case 'APPROVE_COMPANY':
        return 'Approved company'
      case 'RESOLVE_DISPUTE':
        return 'Resolved dispute'
      case 'UPDATE_STATUS':
        return 'Updated shipment status'
      default:
        return action
          .replace(/_/g, ' ')
          .toLowerCase()
          .replace(/^\w/, (c) => c.toUpperCase())
    }
  }

  function actionBadgeClass(action: string) {
    switch (action) {
      case 'APPROVE_COMPANY':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-100'
      case 'RESOLVE_DISPUTE':
        return 'bg-amber-50 text-amber-800 border border-amber-100'
      case 'UPDATE_STATUS':
        return 'bg-accent/10 text-accent border border-accent/20'
      default:
        return 'bg-stone-100 text-stone-700 border border-stone-200'
    }
  }

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Audit Log</h1>
          <p className="text-stone-600 mt-1">
            History of admin actions across companies, shipments, and disputes.
          </p>
        </div>
        <button
          type="button"
          onClick={loadAuditLog}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-600 hover:text-stone-900 hover:underline"
        >
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
          Refresh
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3 text-xs text-stone-600">
        <span className="inline-flex items-center gap-2 rounded-full bg-cream px-3 py-1 border border-stone-200">
          <span className="inline-block h-2 w-2 rounded-full bg-sidebar" />
          <span className="font-semibold text-stone-800">
            {totalEntries}
          </span>
          <span className="text-stone-600">total action{totalEntries === 1 ? '' : 's'}</span>
        </span>
        <span className="inline-flex items-center gap-2 rounded-full bg-sand px-3 py-1 border border-stone-200">
          <span className="inline-block h-2 w-2 rounded-full bg-accent" />
          <span className="font-semibold text-stone-800">
            {todayCount}
          </span>
          <span className="text-stone-600">recorded today</span>
        </span>
        <span className="hidden lg:inline text-stone-500">
          Use this log to trace important decisions and platform changes.
        </span>
      </div>

      {state === 'loading' && (
        <p className="text-stone-500 text-sm mb-4">Loading audit entries…</p>
      )}

      {state === 'error' && error && (
        <p className="text-red-600 text-sm mb-4">{error}</p>
      )}

      {state === 'success' && error && (
        <p className="text-amber-600 text-xs mb-3">{error}</p>
      )}

      {state === 'success' && entries.length === 0 && (
        <div className="bg-white border border-stone-200 rounded-2xl p-8 text-center">
          <p className="text-stone-600">
            No audit entries recorded yet.
          </p>
        </div>
      )}

      {entries.length > 0 && (
        <div className="bg-white border border-stone-200 rounded-2xl overflow-x-auto shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="px-4 py-3 font-semibold text-stone-700">Time</th>
                <th className="px-4 py-3 font-semibold text-stone-700">Admin</th>
                <th className="px-4 py-3 font-semibold text-stone-700">Action</th>
                <th className="px-4 py-3 font-semibold text-stone-700">Target Type</th>
                <th className="px-4 py-3 font-semibold text-stone-700">Target</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} className="border-b border-stone-100 last:border-0">
                  <td className="px-4 py-3 text-stone-500 text-xs">
                    {new Date(e.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-stone-800">{e.adminName}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${actionBadgeClass(
                        e.action,
                      )}`}
                    >
                      {formatAction(e.action)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-stone-700">{e.targetType}</td>
                  <td className="px-4 py-3 text-stone-800">{e.targetId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}