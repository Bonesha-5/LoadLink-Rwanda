import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { apiRequest } from '../api/http'
import type { ApiError } from '../api/http'

type User = {
  id: string
  name: string
  email: string
  role: string
  is_suspended: boolean
  created_at: string
}

export default function AdminUsers() {
  const { user } = useAuth()
  const token = user?.token ?? ''

  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [suspendingId, setSuspendingId] = useState<string | null>(null)
  const [suspendReason, setSuspendReason] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await apiRequest<User[]>('/api/admin/users', { token })
      setUsers(data)
    } catch (e) {
      setError((e as ApiError).message || 'Could not load users.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  async function suspendUser(e: React.FormEvent) {
    e.preventDefault()
    if (!suspendingId || !suspendReason.trim()) return
    setActionLoading(suspendingId)
    try {
      await apiRequest(`/api/admin/users/${suspendingId}/suspend`, {
        method: 'PATCH', token, body: { reason: suspendReason.trim() }
      })
      setUsers(prev => prev.map(u => u.id === suspendingId ? { ...u, is_suspended: true } : u))
      setSuspendingId(null)
      setSuspendReason('')
    } catch (e) {
      alert((e as ApiError).message || 'Could not suspend user.')
    } finally {
      setActionLoading(null)
    }
  }

  async function reinstateUser(id: string) {
    setActionLoading(id)
    try {
      await apiRequest(`/api/admin/users/${id}/reinstate`, { method: 'PATCH', token })
      setUsers(prev => prev.map(u => u.id === id ? { ...u, is_suspended: false } : u))
    } catch (e) {
      alert((e as ApiError).message || 'Could not reinstate user.')
    } finally {
      setActionLoading(null)
    }
  }

  const suspendingUser = users.find(u => u.id === suspendingId) ?? null

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Users</h1>
          <p className="text-sm text-stone-600 mt-1">Manage platform users — suspend or reinstate accounts.</p>
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
      ) : (
        <div className="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="px-4 py-3 font-semibold text-stone-700">Name</th>
                <th className="px-4 py-3 font-semibold text-stone-700">Email</th>
                <th className="px-4 py-3 font-semibold text-stone-700">Role</th>
                <th className="px-4 py-3 font-semibold text-stone-700">Status</th>
                <th className="px-4 py-3 font-semibold text-stone-700">Joined</th>
                <th className="px-4 py-3 font-semibold text-stone-700 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-stone-100 last:border-0 hover:bg-stone-50">
                  <td className="px-4 py-3 font-semibold text-stone-800">{u.name}</td>
                  <td className="px-4 py-3 text-stone-600">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-stone-100 text-stone-700">
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.is_suspended ? (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-700">
                        Suspended
                      </span>
                    ) : (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-stone-500 text-xs">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {u.is_suspended ? (
                        <button
                          type="button"
                          disabled={actionLoading === u.id}
                          onClick={() => reinstateUser(u.id)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 disabled:opacity-60"
                        >
                          Reinstate
                        </button>
                      ) : u.role !== 'ADMIN' ? (
                        <button
                          type="button"
                          disabled={actionLoading === u.id}
                          onClick={() => { setSuspendingId(u.id); setSuspendReason('') }}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 disabled:opacity-60"
                        >
                          Suspend
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Suspend modal */}
      {suspendingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 px-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-semibold text-stone-800 mb-1">Suspend {suspendingUser.name}</h2>
            <p className="text-sm text-stone-600 mb-4">Provide a reason for suspension.</p>
            <form onSubmit={suspendUser} className="space-y-4">
              <textarea rows={3} value={suspendReason} onChange={e => setSuspendReason(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-accent resize-none"
                placeholder="e.g. Repeated policy violations" />
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setSuspendingId(null)}
                  className="px-4 py-2 text-sm font-semibold rounded-xl bg-stone-100 text-stone-700 hover:bg-stone-200">Cancel</button>
                <button type="submit"
                  className="px-4 py-2 text-sm font-semibold rounded-xl bg-red-600 text-white hover:bg-red-700">Confirm suspend</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
