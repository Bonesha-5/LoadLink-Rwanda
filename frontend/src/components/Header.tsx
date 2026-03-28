import { Link } from 'react-router-dom'

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-cream/95 backdrop-blur-md border-b border-stone-200">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <Link to="/" className="font-bold tracking-tight text-sidebar text-lg hover:opacity-90 transition-opacity">
          LoadLink Rwanda
        </Link>

        <div className="flex flex-wrap items-center gap-3 sm:gap-5">
          <Link to="/#why" className="text-sm font-semibold text-stone-700 hover:text-stone-900 transition-colors">
            Why LoadLink
          </Link>
          <span className="hidden sm:inline-block h-5 w-px bg-stone-200" />
          <Link
            to="/login/shipper"
            className="text-sm font-semibold text-stone-700 hover:text-stone-900 transition-colors"
          >
            Shipper
          </Link>
          <Link
            to="/login/company"
            className="text-sm font-semibold text-stone-700 hover:text-stone-900 transition-colors"
          >
            Company
          </Link>
          <Link
            to="/login/admin"
            className="text-sm font-semibold text-stone-700 hover:text-stone-900 transition-colors"
          >
            Admin
          </Link>
        </div>
      </nav>
    </header>
  )
}
