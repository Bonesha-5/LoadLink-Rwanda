import { Link } from 'react-router-dom'

export default function About() {
  return (
    <div className="max-w-6xl mx-auto space-y-8 ll-animate-in">
      <section className="relative overflow-hidden rounded-3xl border border-stone-200 bg-sidebar text-white shadow-xl">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-accent/35 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-cream/10 blur-3xl" />
        </div>
        <div className="relative z-10 p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">About LoadLink Rwanda</h1>
              <p className="text-white/80 mt-2 max-w-2xl text-sm leading-relaxed">
                Faster dispatch with clear pricing: shippers post, verified companies accept, and everyone
                tracks the same shipment stages.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/register/shipper"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white font-semibold hover:bg-accent-hover transition-colors"
              >
                Get started
              </Link>
              <Link
                to="/register/company"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-stone-900 font-semibold hover:bg-stone-50 transition-colors"
              >
                Register company
              </Link>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3 text-xs">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 border border-white/15">
              <span className="inline-block h-2 w-2 rounded-full bg-accent" />
              Fixed price
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 border border-white/15">
              <span className="inline-block h-2 w-2 rounded-full bg-cream" />
              Verification
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 border border-white/15">
              <span className="inline-block h-2 w-2 rounded-full bg-stone-300" />
              Audit trail
            </span>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-3xl border border-stone-200 p-8 shadow-sm">
          <h2 className="text-lg font-semibold text-stone-900">How it works</h2>
          <p className="text-sm text-stone-600 mt-2 max-w-2xl">
            Simple workflow—designed to reduce calls, delays, and negotiation.
          </p>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                t: 'Post',
                d: 'Shippers create a shipment with route, date, weight and fixed price.',
              },
              {
                t: 'Accept',
                d: 'Verified companies accept loads that match their truck capacity.',
              },
              {
                t: 'Track',
                d: 'Shipments move through clear stages. Admins handle disputes and auditing.',
              },
            ].map((s) => (
              <div key={s.t} className="rounded-2xl border border-stone-200 bg-white p-5 hover:shadow-md transition-shadow">
                <p className="text-sm font-semibold text-stone-900">{s.t}</p>
                <p className="text-xs text-stone-600 mt-1 leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/login/shipper"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent-hover transition-colors"
            >
              Shipper portal
            </Link>
            <Link
              to="/login/company"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-stone-800 text-sm font-semibold border border-stone-200 hover:bg-stone-50 transition-colors"
            >
              Company portal
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-stone-200 p-8 shadow-sm">
          <h2 className="text-lg font-semibold text-stone-900">Trust & safety</h2>
          <div className="mt-5 space-y-4">
            {[
              {
                t: 'Verification',
                d: 'Companies can be reviewed before participating.',
              },
              {
                t: 'Audit trail',
                d: 'Admin actions are logged so decisions can be traced.',
              },
              {
                t: 'Clear incentives',
                d: 'Fixed price reduces time waste and makes dispatch simpler.',
              },
            ].map((x) => (
              <div key={x.t} className="rounded-2xl border border-stone-200 bg-cream p-5 hover:shadow-md transition-shadow">
                <p className="text-sm font-semibold text-stone-900">{x.t}</p>
                <p className="text-xs text-stone-600 mt-1 leading-relaxed">{x.d}</p>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <Link
              to="/"
              className="text-sm font-semibold text-stone-700 hover:text-stone-900 hover:underline"
            >
              Back to home
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-sidebar text-white rounded-3xl p-8 shadow-xl border border-white/10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Ready to try it?</h2>
            <p className="text-white/80 text-sm mt-1">
              Start as a shipper or register your company in minutes.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/register/shipper"
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-accent text-white font-semibold hover:bg-accent-hover transition-colors"
            >
              Post a shipment
            </Link>
            <Link
              to="/register/company"
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-white text-stone-900 font-semibold hover:bg-stone-50 transition-colors"
            >
              Join as company
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

