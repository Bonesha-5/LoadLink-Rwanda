import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AdminDashboard() {
  const { user } = useAuth()

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-stone-800 mb-1">
        Welcome, {user?.name}
      </h1>
      <p className="text-stone-600 mb-8">
        Manage LoadLink Rwanda: users, transport companies, shipments, and platform settings. Keep the marketplace running smoothly.
      </p>
      <div className="flex flex-wrap gap-4">
        <Link
          to="/admin/users"
          className="inline-flex items-center gap-2 px-6 py-3.5 bg-accent text-white font-semibold rounded-xl hover:bg-accent-hover transition-all shadow-lg hover:shadow-accent/25"
        >
          <span aria-hidden>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </span>
          Manage Users
        </Link>
        <Link
          to="/admin/shipments"
          className="inline-flex items-center gap-2 px-6 py-3.5 bg-white border-2 border-stone-200 text-stone-800 font-semibold rounded-xl hover:border-stone-300 hover:bg-stone-50 transition-all"
        >
          <span aria-hidden>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </span>
          View Shipments
        </Link>
      </div>
    </div>
  )
}
