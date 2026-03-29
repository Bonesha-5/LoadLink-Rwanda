import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Profile() {
  const { user } = useAuth()

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-stone-800 mb-1">
        Welcome, {user?.name}
      </h1>
      <p className="text-stone-600 mb-8">
        Connect with verified transport companies. Post shipments, get competitive offers, and manage your loads in one place.
      </p>
      <div className="flex flex-wrap gap-4">
        <Link
          to="/post-shipment"
          className="inline-flex items-center gap-2 px-6 py-3.5 bg-accent text-white font-semibold rounded-xl hover:bg-accent-hover transition-all shadow-lg hover:shadow-accent/25"
        >
          <span aria-hidden>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </span>
          Post a Shipment
        </Link>
        <Link
          to="/loads"
          className="inline-flex items-center gap-2 px-6 py-3.5 bg-white border-2 border-stone-200 text-stone-800 font-semibold rounded-xl hover:border-stone-300 hover:bg-stone-50 transition-all"
        >
          <span aria-hidden>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </span>
          My Shipments
        </Link>
      </div>
    </div>
  )
}
