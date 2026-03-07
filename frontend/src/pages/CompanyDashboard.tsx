import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function CompanyDashboard() {
  const { user } = useAuth()

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-stone-800 mb-1">
        Welcome, {user?.name}
      </h1>
      <p className="text-stone-600 mb-8">
        Rwanda&apos;s premier logistics marketplace. Get shipment requests from shippers, submit competitive offers, and grow your transport business.
      </p>
      <div className="flex flex-wrap gap-4">
        <Link
          to="/company/shipments"
          className="inline-flex items-center gap-2 px-6 py-3.5 bg-accent text-white font-semibold rounded-xl hover:bg-accent-hover transition-all shadow-lg hover:shadow-accent/25"
        >
          <span aria-hidden>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </span>
          View Shipments
        </Link>
        <Link
          to="/company/trucks"
          className="inline-flex items-center gap-2 px-6 py-3.5 bg-white border-2 border-stone-200 text-stone-800 font-semibold rounded-xl hover:border-stone-300 hover:bg-stone-50 transition-all"
        >
          <span aria-hidden>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="1" y="3" width="15" height="13" />
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
              <circle cx="5.5" cy="18.5" r="2.5" />
              <circle cx="18.5" cy="18.5" r="2.5" />
            </svg>
          </span>
          Manage Trucks
        </Link>
      </div>
    </div>
  )
}
