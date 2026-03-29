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
          <div className="flex flex-wrap items-center gap-6 sm:gap-8">
            <Link to="/login/shipper" className="text-sidebar/90 hover:text-sidebar font-medium transition-colors">
              Shipper Login
            </Link>
            <Link to="/login/company" className="text-sidebar/90 hover:text-sidebar font-medium transition-colors">
              Company Login
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-24 relative">
        <div className="max-w-3xl text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight leading-tight drop-shadow-lg">
            Connect Shippers with Verified Transport Companies
          </h1>
          <p className="text-xl text-white/90 mt-6 leading-relaxed max-w-2xl mx-auto drop-shadow-md">
            Rwanda&apos;s premier logistics marketplace. Post shipments, get competitive offers from verified truck companies, and enjoy secure escrow payment protection.
          </p>
          <div className="flex flex-wrap gap-4 justify-center mt-12">
            <Link
              to="/register/shipper"
              className="inline-flex items-center gap-2 px-8 py-4 bg-accent text-white font-semibold rounded-xl hover:bg-accent-hover transition-all shadow-xl hover:shadow-2xl hover:shadow-accent/30 hover:-translate-y-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              Post a Shipment
            </Link>
            <Link
              to="/register/company"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-stone-800 font-semibold rounded-xl border-2 border-stone-200 hover:bg-stone-50 hover:border-stone-300 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="1" y="3" width="15" height="13" />
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                <circle cx="5.5" cy="18.5" r="2.5" />
                <circle cx="18.5" cy="18.5" r="2.5" />
              </svg>
              Join as Transport Company
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
