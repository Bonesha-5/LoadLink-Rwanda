import { Link } from 'react-router-dom'

function Icon({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/15 text-accent ring-1 ring-accent/25">
      {children}
    </span>
  )
}

export default function Home() {
  const shipperSteps = [
    {
      title: 'Post a shipment',
      desc: 'Add pickup/dropoff, cargo details, weight, and your fixed price (RWF).',
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: 'Fund escrow',
      desc: 'Lock funds safely so companies can dispatch with confidence and fewer cancellations.',
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 1v22" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 5H9.5a3.5 3.5 0 000 7H14a3.5 3.5 0 010 7H6" />
        </svg>
      ),
    },
    {
      title: 'Track + confirm',
      desc: 'Follow the shipment stages and confirm delivery to release payout.',
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 11l3 3L22 4" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
        </svg>
      ),
    },
  ]

  const companySteps = [
    {
      title: 'Get verified',
      desc: 'Companies submit documents once. Admin verification builds trust for the marketplace.',
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2l7 4v6c0 5-3 9-7 10-4-1-7-5-7-10V6l7-4z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
        </svg>
      ),
    },
    {
      title: 'Accept fixed-price loads',
      desc: 'No bargaining — accept loads that match your fleet capacity and routes.',
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h13v10H3z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 10h3l2 3v4h-5v-7z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 19a2 2 0 104 0H7zM17 19a2 2 0 104 0h-4z" />
        </svg>
      ),
    },
    {
      title: 'Deliver + get paid',
      desc: 'Escrow releases payout after confirmation, with dispute handling if needed.',
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-3.314 0-6 1.791-6 4s2.686 4 6 4 6-1.791 6-4-2.686-4-6-4z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12V6a2 2 0 012-2h8a2 2 0 012 2v6" />
        </svg>
      ),
    },
  ]

  const bullets = [
    { label: 'Escrow-protected payments', desc: 'Funds are locked and released only when delivery is confirmed.' },
    { label: 'Verification + audit trail', desc: 'Admin verification, dispute resolution, and traceable actions.' },
    { label: 'Clear, fixed-price dispatch', desc: 'Faster decisions. Less negotiation. More deliveries.' },
  ]

  const trustedBy = ['Kigali Freight Ltd', 'Green Farms', 'ACME Manufacturing', 'Northern Transport', 'Tech Supplies']

  return (
    <div className="min-h-screen ll-animate-in relative overflow-hidden">
      {/* Page background (extends behind the sticky nav) */}
      <div className="absolute left-0 right-0 top-0 h-[680px] sm:h-[720px] md:h-[820px] -z-10 bg-sidebar" />
      <div className="absolute left-0 right-0 top-0 h-[680px] sm:h-[720px] md:h-[820px] -z-10 bg-[radial-gradient(circle_at_20%_10%,rgba(245,197,24,0.25)_0%,transparent_45%),radial-gradient(circle_at_80%_20%,rgba(245,197,24,0.18)_0%,transparent_45%)]" />
      <div className="absolute left-0 right-0 top-0 h-[680px] sm:h-[720px] md:h-[820px] -z-10 opacity-[0.12] bg-[radial-gradient(circle_at_center,white_1px,transparent_1px)] [background-size:18px_18px]" />

      {/* Top nav — index / landing */}
      <header className="sticky top-0 z-50 bg-transparent">
        <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 shrink-0 group transition-opacity hover:opacity-95"
            aria-label="LoadLink Home"
          >
            <span className="block text-lg font-extrabold tracking-tight leading-none text-white">
              <span className="text-accent">Load</span>
              <span className="text-white/90">Link</span>
            </span>
          </Link>
          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-5 text-sm">
            <a
              href="#how-it-works"
              className="hidden sm:inline font-semibold text-white hover:text-accent transition-colors"
            >
              How it works
            </a>
            <Link to="/about" className="font-semibold text-white hover:text-accent transition-colors">
              About
            </Link>
            <Link to="/login/shipper" className="font-semibold text-white hover:text-accent transition-colors">
              Shipper
            </Link>
            <Link to="/login/company" className="font-semibold text-white hover:text-accent transition-colors">
              Company
            </Link>
            <Link
              to="/login/admin"
              className="rounded-xl px-3 py-1.5 font-semibold text-white hover:text-accent transition-colors"
            >
              Admin
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-14 md:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 text-white px-3 py-1 text-xs font-semibold border border-white/10">
                <span className="inline-block h-2 w-2 rounded-full bg-accent" />
                Digital Freight Marketplace & Escrow Platform
              </div>
              <h1 className="mt-5 text-4xl md:text-6xl font-extrabold tracking-tight text-white leading-[1.05]">
                Connect Shippers with Verified Transport Companies
              </h1>
              <p className="mt-5 text-base md:text-lg text-white/80 leading-relaxed max-w-2xl">
                Rwanda's premier logistics marketplace. Post shipments, get competitive offers from verified truck companies, and
                enjoy secure escrow payment protection.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/register/shipper"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-accent text-sidebar px-6 py-3 font-semibold shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 active:scale-[0.99]"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Start as shipper
                </Link>
                <Link
                  to="/register/company"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white text-sidebar px-6 py-3 font-semibold border border-white/10 hover:bg-white/95 transition-all hover:-translate-y-0.5 active:scale-[0.99]"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h13v10H3z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 10h3l2 3v4h-5v-7z" />
                  </svg>
                  Join as company
                </Link>
                <Link
                  to="/login/admin"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 text-white px-6 py-3 font-semibold border border-white/15 hover:bg-white/15 transition-all"
                >
                  Admin portal
                </Link>
              </div>

              <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { k: '24/7', v: 'Marketplace visibility' },
                  { k: 'Escrow', v: 'Payment protection' },
                  { k: 'Audit', v: 'Admin accountability' },
                ].map((x) => (
                  <div key={x.k} className="rounded-3xl bg-white/5 border border-white/10 p-4">
                    <p className="text-xl font-extrabold text-white">{x.k}</p>
                    <p className="mt-1 text-sm text-white/70">{x.v}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="rounded-[32px] bg-white border border-stone-200 shadow-xl overflow-hidden">
                <div className="p-5 border-b border-stone-200 flex items-center justify-between">
                  <p className="text-sm font-semibold text-stone-900">Marketplace snapshot (demo)</p>
                  <span className="text-xs font-semibold rounded-full bg-accent/15 text-sidebar px-3 py-1 border border-accent/25">
                    Live-style
                  </span>
                </div>
                <div className="p-5 space-y-4">
                  <div className="rounded-3xl border border-stone-200 bg-stone-50 p-4">
                    <p className="text-xs font-semibold text-stone-600">Escrow health</p>
                    <div className="mt-3 h-2.5 rounded-full bg-stone-200 overflow-hidden">
                      <div className="h-full bg-accent" style={{ width: '78%' }} />
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-stone-600">
                      <span>Funded shipments</span>
                      <span className="font-semibold text-stone-900">78%</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { t: 'Avg dispatch time', v: '18 min', d: '-12%' },
                      { t: 'On-time delivery', v: '92%', d: '+3%' },
                    ].map((x) => (
                      <div key={x.t} className="rounded-3xl border border-stone-200 bg-white p-4">
                        <p className="text-xs font-semibold text-stone-600">{x.t}</p>
                        <p className="mt-2 text-2xl font-extrabold text-stone-900">{x.v}</p>
                        <span className="mt-2 inline-flex items-center rounded-full bg-accent/15 text-sidebar px-2.5 py-1 text-xs font-semibold border border-accent/25">
                          {x.d}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-3xl border border-stone-200 bg-white p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-stone-600">User mix</p>
                      <p className="text-xs text-stone-500">demo</p>
                    </div>
                    <div className="mt-3 space-y-3">
                      {[
                        { label: 'Shippers', value: 68 },
                        { label: 'Companies', value: 26 },
                        { label: 'Admins', value: 6 },
                      ].map((r) => (
                        <div key={r.label}>
                          <div className="flex items-center justify-between text-xs text-stone-600">
                            <span className="font-semibold">{r.label}</span>
                            <span>{r.value}%</span>
                          </div>
                          <div className="mt-2 h-2.5 w-full rounded-full bg-stone-200 overflow-hidden">
                            <div
                              className={r.label === 'Companies' ? 'h-full bg-sidebar' : r.label === 'Admins' ? 'h-full bg-stone-400' : 'h-full bg-accent'}
                              style={{ width: `${r.value}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <Link
                  to="/login/shipper"
                  className="rounded-3xl bg-white/10 border border-white/15 text-white p-4 hover:bg-white/15 transition-all"
                >
                  <p className="text-sm font-semibold">Shipper portal</p>
                  <p className="mt-1 text-xs text-white/70">Post + fund escrow</p>
                </Link>
                <Link
                  to="/login/company"
                  className="rounded-3xl bg-white/10 border border-white/15 text-white p-4 hover:bg-white/15 transition-all"
                >
                  <p className="text-sm font-semibold">Company portal</p>
                  <p className="mt-1 text-xs text-white/70">Accept + deliver</p>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-4 sm:px-6 pb-12 md:pb-16">
        <div className="rounded-[36px] bg-white border border-stone-200 shadow-sm overflow-hidden">
          <div className="p-7 border-b border-stone-200 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-stone-600">Workflow</p>
              <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-stone-900">How LoadLink works</h2>
              <p className="mt-2 text-sm text-stone-600 max-w-2xl">
                Two simple journeys — one marketplace. Escrow keeps transactions fair and reduces cancellations.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/login/shipper" className="rounded-2xl bg-sidebar text-white px-5 py-2.5 font-semibold hover:bg-sidebar-hover transition-colors">
                Shipper portal
              </Link>
              <Link to="/login/company" className="rounded-2xl bg-accent text-sidebar px-5 py-2.5 font-semibold hover:bg-accent-hover transition-colors">
                Company portal
              </Link>
            </div>
          </div>

          <div className="p-7 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-3xl border border-stone-200 bg-stone-50 p-6">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-sidebar text-white">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </span>
                <div>
                  <p className="text-sm font-extrabold text-stone-900">For shippers</p>
                  <p className="text-sm text-stone-600">Post → escrow → track</p>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-1 gap-3">
                {shipperSteps.map((s) => (
                  <div key={s.title} className="rounded-3xl bg-white border border-stone-200 p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-accent/15 text-accent ring-1 ring-accent/25">
                        {s.icon}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-stone-900">{s.title}</p>
                        <p className="mt-1 text-sm text-stone-600 leading-relaxed">{s.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-stone-200 bg-stone-50 p-6">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-accent text-sidebar">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h13v10H3z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 10h3l2 3v4h-5v-7z" />
                  </svg>
                </span>
                <div>
                  <p className="text-sm font-extrabold text-stone-900">For companies</p>
                  <p className="text-sm text-stone-600">Verify → accept → deliver</p>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-1 gap-3">
                {companySteps.map((s) => (
                  <div key={s.title} className="rounded-3xl bg-white border border-stone-200 p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-accent/15 text-accent ring-1 ring-accent/25">
                        {s.icon}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-stone-900">{s.title}</p>
                        <p className="mt-1 text-sm text-stone-600 leading-relaxed">{s.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem / Solution / Mission */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-16 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 rounded-3xl bg-white border border-stone-200 p-7 shadow-sm hover:shadow-md transition-shadow">
            <Icon>
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </Icon>
            <p className="mt-4 text-sm font-semibold text-stone-900">The problem</p>
            <p className="mt-2 text-sm text-stone-600 leading-relaxed">
              Freight coordination is slow and risky: endless calls, unclear pricing, cancellations, and payment disputes.
            </p>
          </div>

          <div className="lg:col-span-4 rounded-3xl bg-white border border-stone-200 p-7 shadow-sm hover:shadow-md transition-shadow">
            <Icon>
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2l7 4v6c0 5-3 9-7 10-4-1-7-5-7-10V6l7-4z" />
              </svg>
            </Icon>
            <p className="mt-4 text-sm font-semibold text-stone-900">The solution</p>
            <p className="mt-2 text-sm text-stone-600 leading-relaxed">
              A digital marketplace with escrow: shippers post fixed-price shipments, verified companies accept, escrow funds
              are released on delivery confirmation.
            </p>
          </div>

          <div className="lg:col-span-4 rounded-3xl bg-sidebar text-white border border-white/10 p-7 shadow-sm hover:shadow-md transition-shadow">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold border border-white/10">
              <span className="inline-block h-2 w-2 rounded-full bg-accent" />
              Our mission
            </span>
            <p className="mt-4 text-xl font-extrabold tracking-tight">Trust, speed, and fairness in freight.</p>
            <p className="mt-2 text-sm text-white/75 leading-relaxed">
              Help Rwanda’s shippers and carriers move goods faster — with verified partners, transparent pricing, and secure escrow payments.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {bullets.map((b) => (
            <div key={b.label} className="rounded-3xl bg-white border border-stone-200 p-6 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-sm font-semibold text-stone-900">{b.label}</p>
              <p className="mt-1 text-sm text-stone-600 leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust strip */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-14">
        <div className="rounded-[36px] bg-sidebar text-white border border-white/10 p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-white/70">Trusted by</p>
              <p className="mt-1 text-lg font-extrabold tracking-tight">Teams moving goods every day (demo)</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to="/about" className="rounded-2xl bg-white/10 border border-white/15 px-4 py-2 text-sm font-semibold hover:bg-white/15 transition-colors">
                Learn more
              </Link>
              <Link to="/register/shipper" className="rounded-2xl bg-accent text-sidebar px-4 py-2 text-sm font-semibold hover:bg-accent-hover transition-colors">
                Get started
              </Link>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {trustedBy.map((name) => (
              <div key={name} className="rounded-3xl bg-white/5 border border-white/10 px-4 py-3">
                <p className="text-xs font-semibold text-white/80 truncate">{name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
