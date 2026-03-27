import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { addLoad, setStageForLoad } from '../data/storage'

const RWANDA_DISTRICTS = [
  'Bugesera','Burera','Gakenke','Gasabo','Gatsibo','Gicumbi','Gisagara',
  'Huye','Kamonyi','Karongi','Kayonza','Kicukiro','Kirehe','Muhanga',
  'Musanze','Ngoma','Ngororero','Nyabihu','Nyagatare','Nyamagabe',
  'Nyamasheke','Nyanza','Nyarugenge','Nyaruguru','Rubavu','Ruhango',
  'Rulindo','Rusizi','Rutsiro','Rwamagana',
]

export default function PostShipment() {
  const navigate = useNavigate()
  const { user, getToken } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    origin: '',
    destination: '',
    pickupDescription: '',
    description: '',
    weight: '',
    price: '',
    date: '',
  })
  const [errors, setErrors] = useState<Partial<typeof form & { sameDistrict: string }>>({})

  const onChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: '', sameDistrict: '' }))
  }

  const validate = (): boolean => {
    const e: typeof errors = {}
    if (!form.origin)      e.origin      = 'Pickup district is required'
    if (!form.destination) e.destination = 'Drop-off district is required'
    if (form.origin && form.destination && form.origin === form.destination)
      e.sameDistrict = 'Pickup and drop-off district cannot be the same'
    if (!form.weight)      e.weight      = 'Weight is required'
    if (!form.price)       e.price       = 'Price is required'
    if (!form.date)        e.date        = 'Pickup date is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const onSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)

    const localSave = () => {
      const newLoad = addLoad({
        origin:        form.origin,
        destination:   form.destination,
        date:          form.date,
        weight:        `${form.weight} tons`,
        description:   form.description,
        pickupAddress: form.pickupDescription,
        price:         `${Number(form.price).toLocaleString()} RWF`,
        createdBy:     user?.name || 'Shipper',
      })
      setStageForLoad(newLoad.id, 'POSTED')
    }

    try {
      const res = await fetch('/api/shipments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          pickup_district:    form.origin,
          dropoff_district:   form.destination,
          pickup_description: form.pickupDescription,
          cargo_description:  form.description,
          weight:             Number(form.weight),
          offered_price:      Number(form.price),
          pickup_date:        form.date,
        }),
      })
      if (!res.ok) throw new Error()
    } catch {
      // API unavailable — save locally
    } finally {
      localSave()
      setSubmitting(false)
      navigate('/loads')
    }
  }

  const inputCls  = 'w-full rounded-2xl border bg-cream px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20'

  return (
    <div className="space-y-6 ll-animate-in">
      <Link to="/profile" className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 text-stone-600 px-4 py-2 text-sm font-semibold hover:bg-stone-50 transition-colors">
        ← Dashboard
      </Link>
      <div>
        <h1 className="text-3xl font-bold text-sidebar" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Post Shipment</h1>
        <p className="text-sm text-stone-600 mt-1">Create a new shipment request</p>
      </div>

      <form onSubmit={onSubmit} className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        {/* Top accent border */}
        <div className="h-1 w-full bg-sidebar" />

        <div className="p-6 space-y-5">
          {/* Section header */}
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-5 h-5 text-sidebar" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
            <h2 className="text-base font-bold text-stone-800">Shipment Details</h2>
          </div>

          {errors.sameDistrict && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm text-red-700 font-semibold">{errors.sameDistrict}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Pickup District *" error={errors.origin}>
              <DistrictSelect
                value={form.origin}
                onChange={(val) => onChange('origin', val)}
                options={RWANDA_DISTRICTS}
                error={!!errors.origin}
              />
            </Field>

            <Field label="Drop-off District *" error={errors.destination}>
              <DistrictSelect
                value={form.destination}
                onChange={(val) => onChange('destination', val)}
                options={RWANDA_DISTRICTS.filter((d) => d !== form.origin)}
                error={!!errors.destination}
              />
            </Field>
          </div>

          <Field label="Pickup Description (Landmark or Road Number)">
            <input
              className={`${inputCls} border-stone-200`}
              value={form.pickupDescription}
              onChange={(e) => onChange('pickupDescription', e.target.value)}
              placeholder="e.g., Near Nyabugogo Market, KN 3 Road"
            />
          </Field>

          <Field label="Cargo Description">
            <textarea
              className={`${inputCls} border-stone-200 min-h-24 resize-none`}
              value={form.description}
              onChange={(e) => onChange('description', e.target.value)}
              placeholder="Describe your cargo…"
            />
          </Field>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Cargo Weight (tons) *" error={errors.weight}>
              <input
                className={`${inputCls} ${errors.weight ? 'border-red-300' : 'border-stone-200'}`}
                type="number"
                step="0.1"
                min="0.1"
                value={form.weight}
                onChange={(e) => onChange('weight', e.target.value)}
                placeholder="e.g. 8.5"
              />
            </Field>

            <Field label="Offered Price (RWF) *" error={errors.price}>
              <input
                className={`${inputCls} ${errors.price ? 'border-red-300' : 'border-stone-200'}`}
                type="number"
                min="1"
                value={form.price}
                onChange={(e) => onChange('price', e.target.value)}
                placeholder="e.g., 250000"
              />
            </Field>
          </div>

          <Field label="Pickup Date *" error={errors.date}>
            <input
              className={`${inputCls} ${errors.date ? 'border-red-300' : 'border-stone-200'}`}
              type="date"
              value={form.date}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => onChange('date', e.target.value)}
            />
          </Field>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center rounded-2xl bg-accent text-sidebar px-6 py-3 font-semibold hover:bg-accent-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? 'Posting…' : 'Post Shipment'}
          </button>
        </div>
      </form>
    </div>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-stone-700 mb-2">{label}</span>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </label>
  )
}

function DistrictSelect({
  value,
  onChange,
  options,
  placeholder = 'Select district',
  error,
}: {
  value: string
  onChange: (val: string) => void
  options: string[]
  placeholder?: string
  error?: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full rounded-2xl border px-4 py-3 text-sm text-left flex items-center justify-between focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 bg-cream ${
          error ? 'border-red-300' : 'border-stone-200'
        } ${value ? 'text-stone-800' : 'text-stone-400'}`}
      >
        {value || placeholder}
        <svg className="w-4 h-4 text-stone-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <ul className="absolute z-50 mt-1 w-full bg-white border border-stone-200 rounded-2xl shadow-lg max-h-56 overflow-y-auto py-1">
          {options.map((opt) => (
            <li
              key={opt}
              onMouseDown={() => { onChange(opt); setOpen(false) }}
              className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${
                opt === value
                  ? 'bg-accent text-white font-semibold'
                  : 'text-stone-800 hover:bg-accent hover:text-white'
              }`}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
