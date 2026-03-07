import { Link } from 'react-router-dom'

export default function Header() {
  return (
    <header className="bg-sidebar text-white">
      <nav className="max-w-6xl mx-auto px-6 py-4 flex flex-wrap items-center gap-6">
        <Link to="/" className="font-bold">
          LoadLink Rwanda
        </Link>
        <Link to="/loads" className="text-white/90 hover:text-white transition-colors">Loads</Link>
        <Link to="/trucks" className="text-white/90 hover:text-white transition-colors">Trucks</Link>
        <Link to="/login/shipper" className="text-white/90 hover:text-white transition-colors">Shipper Login</Link>
        <Link to="/login/company" className="text-white/90 hover:text-white transition-colors">Company Login</Link>
        <Link to="/login/admin" className="text-white/90 hover:text-white transition-colors">Admin</Link>
        <Link to="/ussd-help" className="text-white/90 hover:text-white transition-colors">USSD Help</Link>
      </nav>
    </header>
  )
}
