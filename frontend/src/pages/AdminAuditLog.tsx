import { useEffect, useState } from 'react'

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
    try {
      setState('loading')
      setError(null)
      const res = await fetch('/api/admin/audit')
      if (!res.ok) throw new Error('Failed to load audit log')
      const data: AuditEntry[] = await res.json()
      setEntries(data)
      setState('success')
    } catch (err) {
      console.error(err)
      // Fallback demo entries so UI looks complete even without backend.
      const now = new Date()
      const demo: AuditEntry[] = [
        {
          id: 'AUD-001',
          timestamp: now.toISOString(),
          adminName: 'Admin A',
          action: 'APPROVE_COMPANY',
          targetType: 'COMPANY',
          targetId: 'Kigali Freight Ltd',
        },
        {
          id: 'AUD-002',
          timestamp: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
          adminName: 'Admin B',
          action: 'RESOLVE_DISPUTE',
          targetType: 'SHIPMENT',
          targetId: 'DIS-001',
        },
        {
          id: 'AUD-003',
          timestamp: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
          adminName: 'Admin A',
          action: 'UPDATE_STATUS',
          targetType: 'SHIPMENT',
          targetId: 'SH-002',
        },
      ]
      setEntries(demo)
      setError('Showing demo audit entries because the API is not reachable yet.')
      setState('success')
    }
  }

  useEffect(() => {
    void loadAuditLog()
  }, [])

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
          className="text-sm font-semibold text-stone-600 hover:text-stone-900 hover:underline"
        >
          Refresh
        </button>
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
                  <td className="px-4 py-3 text-stone-700">{e.action}</td>
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