import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col relative">
      <div
        className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/cargo.jpg)' }}
      />
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-sidebar/90 via-sidebar/75 to-sidebar/95" />
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(61,41,35,0.4)_100%)]" />

      <header className="bg-cream/95 backdrop-blur-md border-b border-sidebar/20 sticky top-0 z-50">
        <nav className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold tracking-tight text-sidebar">
            LoadLink Rwanda
          </Link>
          <div className="flex items-center gap-6">
            <Link to="/loads" className="text-sidebar/90 hover:text-sidebar font-medium transition-colors">
              Find Loads
            </Link>
            <Link to="/trucks" className="text-sidebar/90 hover:text-sidebar font-medium transition-colors">
              Find Trucks
            </Link>
            <Link to="/login" className="text-sidebar/90 hover:text-sidebar font-medium transition-colors">
              Login
            </Link>
            <Link
              to="/register"
              className="px-5 py-2.5 bg-accent text-white font-semibold rounded-xl hover:bg-accent-hover hover:shadow-lg hover:shadow-accent/25 transition-all"
            >
              Register
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-24 relative">
        <div className="max-w-3xl text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight leading-tight drop-shadow-lg">
            Connect shippers and truck owners
          </h1>
          <p className="text-xl text-white/90 mt-6 leading-relaxed max-w-2xl mx-auto drop-shadow-md">
            Reduce empty trips. Lower costs. Build a smarter logistics network across Rwanda.
          </p>
          <div className="flex flex-wrap gap-4 justify-center mt-12">
            <Link
              to="/register"
              className="px-8 py-4 bg-accent text-white font-semibold rounded-xl hover:bg-accent-hover transition-all shadow-xl hover:shadow-2xl hover:shadow-accent/30 hover:-translate-y-1"
            >
              Get Started
            </Link>
            <Link
              to="/loads"
              className="px-8 py-4 bg-white/15 backdrop-blur-sm text-white font-semibold rounded-xl border-2 border-white/30 hover:bg-white/25 hover:border-white/50 transition-all"
            >
              Browse Loads
            </Link>
          </div>
        </div>
      </main>

      <footer className="bg-sidebar/90 backdrop-blur-sm border-t border-white/10 py-6 text-center">
        <p className="text-sm text-white/80">LoadLink Rwanda — Connecting shippers and truck owners</p>
      </footer>
    </div>
  )
}
