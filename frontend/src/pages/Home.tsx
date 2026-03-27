import { Link } from 'react-router-dom'
import { useCallback, useEffect, useState } from 'react'

const PARTNERS = [
  'Kigali Freight Ltd',
  'Green Farms',
  'ACME Manufacturing',
  'Northern Transport',
  'Tech Supplies',
  'Rwanda Cargo Co',
  'Musanze Haulage',
  'Lake Logistics',
]

export default function Home() {
  const [scrolled, setScrolled] = useState(false)
  const [showTop, setShowTop] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      setScrolled(y > 48)
      setShowTop(y > 400)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const navLinkClass = scrolled
    ? 'font-semibold text-stone-800 hover:text-accent transition-colors'
    : 'font-semibold text-white hover:text-accent transition-colors'

  return (
    <div id="top" className="min-h-screen ll-animate-in relative overflow-x-hidden ll-snap-page">
      <div className="relative">
        {/* Hero background (stretches with hero height) */}
        <div className="absolute inset-0 -z-10 bg-sidebar" aria-hidden />
        <div
          className="absolute inset-0 -z-10 pointer-events-none"
          style={{
            WebkitMaskImage:
              'linear-gradient(180deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0) 100%)',
            maskImage:
              'linear-gradient(180deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0) 100%)',
          }}
          aria-hidden
        >
          <video
            className="h-full w-full object-cover opacity-[0.22]"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
          >
            <source src="/hero.mp4" type="video/mp4" />
          </video>
        </div>
        <div className="absolute inset-0 -z-10 bg-sidebar/25" aria-hidden />
        <div
          className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_10%,rgba(245,197,24,0.25)_0%,transparent_45%),radial-gradient(circle_at_80%_20%,rgba(245,197,24,0.18)_0%,transparent_45%)]"
          aria-hidden
        />
        <div
          className="absolute inset-0 -z-10 opacity-[0.12] bg-[radial-gradient(circle_at_center,white_1px,transparent_1px)] [background-size:18px_18px]"
          aria-hidden
        />

        <header
          className={`sticky top-0 z-50 transition-[background-color,box-shadow,border-color] duration-300 ${
            scrolled ? 'bg-white/75 backdrop-blur-md border-b border-stone-200/60 shadow-sm' : 'bg-transparent'
          }`}
        >
          <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
            <Link to="/" className="shrink-0 group transition-opacity hover:opacity-95" aria-label="LoadLink Home">
              <span
                className={`text-lg font-extrabold tracking-tight leading-none transition-colors ${
                  scrolled ? 'text-sidebar' : ''
                }`}
              >
                <span className="text-accent">Load</span>
                <span className={scrolled ? 'text-stone-900' : 'text-white/90'}>Link</span>
              </span>
            </Link>
            <div className="flex flex-wrap items-center justify-end gap-x-2 gap-y-1.5 text-[12px] max-[360px]:text-[11px] sm:text-sm">
              <a href="#trucks" className={`hidden md:inline ${navLinkClass}`}>
                Trucks
              </a>
              <a href="#how-it-works" className={`hidden sm:inline ${navLinkClass}`}>
                How it works
              </a>
              <a href="#why" className={`hidden md:inline ${navLinkClass}`}>
                Why us
              </a>
              <a href="#partners" className={`hidden md:inline ${navLinkClass}`}>
                Partners
              </a>
              <Link to="/login/shipper" className={navLinkClass}>
                Shipper
              </Link>
              <Link to="/login/company" className={navLinkClass}>
                Company
              </Link>
              <Link to="/login/admin" className={navLinkClass}>
                Admin
              </Link>
            </div>
          </nav>
        </header>

        {/* Hero */}
        <section className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-16 sm:pb-20 md:py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-10 lg:gap-12 items-center">
          <div className="lg:col-span-7 relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 text-white px-3 py-1 text-xs font-semibold border border-white/10">
              <span className="inline-block h-2 w-2 rounded-full bg-accent" />
              Trucks & loads in one place
            </div>
            <h1 className="mt-5 text-[2rem] max-[360px]:text-[1.75rem] sm:text-[2.35rem] md:text-[2.75rem] font-extrabold tracking-tight text-white leading-[1.1]">
              Need a truck? Or filling your trucks?
            </h1>
            <p className="mt-4 sm:mt-5 text-[15px] max-[360px]:text-[14px] sm:text-base md:text-lg text-white/85 leading-relaxed max-w-xl">
              LoadLink connects people <strong className="text-white font-semibold">sending goods</strong> with{' '}
              <strong className="text-white font-semibold">transport companies</strong> in Rwanda. The price is clear up front.
              Your payment stays protected until delivery is done.
            </p>
            <div id="start" className="mt-7 sm:mt-8 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3">
              <Link
                to="/register/shipper"
                className="inline-flex w-full sm:w-auto items-center justify-center rounded-2xl bg-accent text-sidebar px-5 sm:px-6 py-3.5 font-semibold text-[15px] sm:text-base shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 active:scale-[0.99]"
              >
                I’m sending goods
              </Link>
              <Link
                to="/register/company"
                className="inline-flex w-full sm:w-auto items-center justify-center rounded-2xl bg-white text-sidebar px-5 sm:px-6 py-3.5 font-semibold text-[15px] sm:text-base border border-white/10 hover:bg-white/95 transition-all hover:-translate-y-0.5 active:scale-[0.99]"
              >
                I have trucks
              </Link>
              <Link
                to="/login/admin"
                className="inline-flex w-full sm:w-auto items-center justify-center rounded-2xl bg-white/10 text-white px-5 py-3.5 font-semibold border border-white/15 hover:bg-white/15 transition-all text-[13px] sm:text-sm"
              >
                Staff login
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5 relative z-10">
            <div className="rounded-[28px] sm:rounded-[32px] bg-white/5 border border-white/12 shadow-[0_24px_70px_rgba(0,0,0,0.45)] overflow-hidden backdrop-blur-md">
              <div className="p-5 border-b border-white/10 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-white">Start here</p>
                <span className="text-xs font-semibold rounded-full bg-white/10 text-white px-3 py-1 border border-white/10">
                  Quick steps
                </span>
              </div>
              <div className="p-4 sm:p-5 space-y-4">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs font-semibold text-white/75">If you’re sending goods</p>
                  <p className="mt-1 text-sm text-white/90 leading-relaxed">
                    Create a shipment, choose a truck, pay into a protected hold, then confirm delivery.
                  </p>
                  <Link
                    to="/register/shipper"
                    className="mt-3 inline-flex items-center justify-center rounded-2xl bg-accent text-sidebar px-4 py-2 text-sm font-semibold hover:bg-accent-hover transition-colors"
                  >
                    Create shipper account
                  </Link>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs font-semibold text-white/75">If you have trucks</p>
                  <p className="mt-1 text-sm text-white/90 leading-relaxed">
                    Register your company, add trucks, then express interest in available shipments.
                  </p>
                  <Link
                    to="/register/company"
                    className="mt-3 inline-flex items-center justify-center rounded-2xl bg-white text-sidebar px-4 py-2 text-sm font-semibold hover:bg-white/90 transition-colors"
                  >
                    Register company
                  </Link>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs font-semibold text-white/75">Clear price</p>
                    <p className="mt-2 text-lg font-extrabold text-white">Up front</p>
                    <p className="mt-1 text-xs text-white/70">No guessing mid-way.</p>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs font-semibold text-white/75">Protected payment</p>
                    <p className="mt-2 text-lg font-extrabold text-white">Escrow</p>
                    <p className="mt-1 text-xs text-white/70">Paid when delivery is done.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        </section>
      </div>

      <section id="trucks" className="bg-gradient-to-b from-slate-50 to-white border-y border-stone-200/80 ll-snap-section">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-20 lg:min-h-[82vh] flex flex-col justify-center">
          <div className="flex items-start justify-between gap-4">
            <div className="max-w-2xl">
              <h2 className="text-3xl md:text-4xl font-extrabold text-stone-900 tracking-tight">Built around real trucks</h2>
              <p className="mt-4 text-base md:text-lg text-stone-600 leading-relaxed">
                Companies show their fleet. Shippers say where goods go and how heavy they are. Less calling around, more
                clarity.
              </p>
            </div>
            <a
              href="#top"
              className="shrink-0 inline-flex items-center gap-2 rounded-full bg-white border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:text-accent hover:border-accent/40 transition-colors"
            >
              <span>Back to top</span>
              <span aria-hidden>↑</span>
            </a>
          </div>
          <div className="mt-10 sm:mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
            {[
              { t: 'Same route for everyone', d: 'Pickup and drop-off are visible to both sides.' },
              { t: 'Price agreed early', d: 'The shipper sets the price before a truck is booked.' },
              { t: 'Money held safely', d: 'Payment for the trip is protected until delivery is confirmed.' },
            ].map((c) => (
              <div
                key={c.t}
                className="rounded-3xl bg-white border border-stone-200 p-6 sm:p-7 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="h-1 w-10 rounded-full bg-accent mb-4" />
                <p className="font-semibold text-[1.05rem] sm:text-lg text-stone-900">{c.t}</p>
                <p className="mt-2 text-[15px] sm:text-base text-stone-600 leading-relaxed">{c.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        className="max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-20 lg:min-h-[82vh] flex flex-col justify-center ll-snap-section"
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-full flex items-start justify-between gap-4">
            <div className="flex-1" />
            <a
              href="#top"
              className="shrink-0 inline-flex items-center gap-2 rounded-full bg-white border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:text-accent hover:border-accent/40 transition-colors"
            >
              <span>Back to top</span>
              <span aria-hidden>↑</span>
            </a>
          </div>
          <h2 className="text-[1.85rem] sm:text-3xl md:text-4xl font-extrabold text-stone-900 tracking-tight text-center max-w-2xl mx-auto">
            How it works — three steps
          </h2>
          <p className="text-center text-stone-600 max-w-2xl mx-auto text-[15px] sm:text-base md:text-lg">
            Shippers and truck companies use the same flow; you just sign in as the role that fits you.
          </p>
        </div>
        <ol className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              n: '1',
              t: 'List or look',
              d: 'Shipper: what you’re moving and what you’ll pay. Company: open trips you can take on.',
            },
            {
              n: '2',
              t: 'Choose & pay in safely',
              d: 'Pick a truck you trust. The shipper pays into a hold so the job can start.',
            },
            {
              n: '3',
              t: 'Deliver & close',
              d: 'Follow the trip. When goods arrive, the shipper confirms and payment is completed.',
            },
          ].map((step) => (
            <li
              key={step.n}
              className="relative rounded-3xl border border-stone-200 bg-white p-6 sm:p-7 pt-9 shadow-sm"
            >
              <span className="absolute -top-3 left-6 inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-sidebar text-white text-sm font-extrabold">
                {step.n}
              </span>
              <p className="font-semibold text-stone-900 text-lg sm:text-xl">{step.t}</p>
              <p className="mt-2 text-[15px] sm:text-base text-stone-600 leading-relaxed">{step.d}</p>
            </li>
          ))}
        </ol>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link
            to="/register/shipper"
            className="rounded-2xl bg-sidebar text-white px-6 py-3 font-semibold hover:bg-sidebar-hover transition-colors"
          >
            Create shipper account
          </Link>
          <Link
            to="/register/company"
            className="rounded-2xl bg-accent text-sidebar px-6 py-3 font-semibold hover:bg-accent-hover transition-colors"
          >
            Register your company
          </Link>
        </div>
      </section>

      <section id="why" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-20 lg:min-h-[82vh] flex flex-col justify-center ll-snap-section">
        <div className="rounded-[30px] sm:rounded-[36px] bg-white border border-stone-200 shadow-sm overflow-hidden">
          <div className="p-8 md:p-11 border-b border-stone-100 bg-stone-50/80 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-[1.85rem] sm:text-3xl md:text-4xl font-extrabold text-stone-900 tracking-tight">Why people use LoadLink</h2>
              <p className="mt-3 text-[15px] sm:text-base md:text-lg text-stone-600 max-w-2xl">
                Moving cargo shouldn’t mean guessing prices or chasing people on the phone. Here, the steps stay visible for both
                sides.
              </p>
            </div>
            <a
              href="#top"
              className="shrink-0 inline-flex items-center gap-2 rounded-full bg-white border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:text-accent hover:border-accent/40 transition-colors"
            >
              <span>Back to top</span>
              <span aria-hidden>↑</span>
            </a>
          </div>
          <div className="p-8 md:p-11 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                t: 'Less back-and-forth',
                d: 'Details and price are on the screen before anyone commits.',
              },
              {
                t: 'Companies can be checked',
                d: 'Transport businesses can go through a review so shippers know who they’re dealing with.',
              },
              {
                t: 'Help if something goes wrong',
                d: 'If there’s a disagreement, staff can step in — not “sort it out alone.”',
              },
            ].map((x) => (
              <div key={x.t} className="rounded-2xl border border-stone-200 bg-cream p-5 sm:p-6">
                <p className="font-semibold text-[1.05rem] sm:text-lg text-stone-900">{x.t}</p>
                <p className="mt-2 text-[15px] sm:text-base text-stone-600 leading-relaxed">{x.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partners — bottom, full-width, catchy */}
      <section id="partners" className="relative mt-2 border-t border-accent/30 bg-sidebar overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 50%, #F5C518 0%, transparent 50%), radial-gradient(circle at 80% 50%, #F5C518 0%, transparent 45%)',
          }}
          aria-hidden
        />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="text-center md:text-left w-full md:w-auto">
              <p className="text-accent text-xs font-bold uppercase tracking-[0.25em]">Together on the road</p>
              <h2 className="mt-3 text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                Names you’ll see on LoadLink
              </h2>
              <p className="mt-2 text-sm text-white/65 max-w-lg mx-auto md:mx-0 leading-relaxed">
                Sample businesses in our demo — your team can be on this list next.
              </p>
            </div>
            <a
              href="#top"
              className="shrink-0 inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/90 hover:text-accent hover:border-accent/40 transition-colors backdrop-blur-sm"
            >
              <span>Back to top</span>
              <span aria-hidden>↑</span>
            </a>
          </div>
        </div>
        <div className="relative pb-12 pt-6">
          <div
            className="pointer-events-none absolute left-0 top-0 bottom-0 w-20 z-10 bg-gradient-to-r from-sidebar to-transparent"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute right-0 top-0 bottom-0 w-20 z-10 bg-gradient-to-l from-sidebar to-transparent"
            aria-hidden
          />
          <div className="flex w-max ll-partners-track hover:[animation-play-state:paused] items-center gap-0">
            {[...PARTNERS, ...PARTNERS].map((name, i) => (
              <div
                key={`${name}-${i}`}
                className="mx-3 sm:mx-4 shrink-0 rounded-2xl border border-white/15 bg-white/[0.06] px-5 py-3 backdrop-blur-sm"
              >
                <span className="text-sm font-semibold text-white tracking-tight whitespace-nowrap">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-stone-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            <div>
              <p className="text-base font-bold text-stone-900 tracking-tight">LoadLink Rwanda</p>
              <p className="mt-1 text-sm text-stone-600 max-w-sm">Shippers and truck companies, one simple place to connect.</p>
            </div>
            <nav className="flex flex-wrap items-center justify-center md:justify-end gap-x-8 gap-y-3 text-sm">
              <a href="#trucks" className="font-semibold text-stone-700 hover:text-accent transition-colors">
                Trucks
              </a>
              <a href="#how-it-works" className="font-semibold text-stone-700 hover:text-accent transition-colors">
                How it works
              </a>
              <a href="#why" className="font-semibold text-stone-700 hover:text-accent transition-colors">
                Why us
              </a>
              <a href="#partners" className="font-semibold text-stone-700 hover:text-accent transition-colors">
                Partners
              </a>
            </nav>
          </div>
          <p className="mt-8 pt-8 border-t border-stone-100 text-center text-xs text-stone-400">
            © {new Date().getFullYear()} LoadLink Rwanda
          </p>
        </div>
      </footer>

      {/* Back to top — brand colors, aligned with content column */}
      <div className="fixed bottom-0 left-0 right-0 z-[60] pointer-events-none">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-6 flex justify-end">
          <button
            type="button"
            onClick={scrollToTop}
            aria-label="Back to top"
            className={`pointer-events-auto flex items-center gap-2 rounded-2xl bg-sidebar pl-4 pr-5 py-3 text-sm font-semibold text-accent border border-accent/35 shadow-[0_10px_40px_rgba(0,0,0,0.35)] transition-all duration-300 hover:bg-sidebar-hover hover:border-accent hover:shadow-[0_14px_44px_rgba(0,0,0,0.4)] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-sand ${
              showTop ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0 pointer-events-none'
            }`}
          >
            <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            Top
          </button>
        </div>
      </div>
    </div>
  )
}
