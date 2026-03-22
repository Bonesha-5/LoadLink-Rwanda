import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="border-t border-stone-200 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <p className="text-sm font-semibold text-stone-900">LoadLink Rwanda</p>
          <p className="mt-1 text-sm text-stone-600">Connecting shippers and verified transport companies.</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <Link to="/about" className="font-semibold text-stone-700 hover:text-stone-900 transition-colors">
            About
          </Link>
          <Link to="/ussd-help" className="font-semibold text-stone-700 hover:text-stone-900 transition-colors">
            USSD help
          </Link>
          <Link to="/login/admin" className="font-semibold text-stone-700 hover:text-stone-900 transition-colors">
            Admin portal
          </Link>
        </div>
      </div>
    </footer>
  )
}
