import { Link } from 'react-router-dom'

export default function Header() {
  return (
    <header className="bg-sidebar text-white">
      <nav className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-6">
        <Link to="/" className="font-bold">
          LoadLink Rwanda
        </Link>
        <Link to="/loads" className="text-white/90 hover:text-white transition-colors">Loads</Link>
        <Link to="/trucks" className="text-white/90 hover:text-white transition-colors">Trucks</Link>
        <Link to="/login" className="text-white/90 hover:text-white transition-colors">Login</Link>
        <Link to="/ussd-help" className="text-white/90 hover:text-white transition-colors">USSD Help</Link>
      </nav>
    </header>
  )
}
