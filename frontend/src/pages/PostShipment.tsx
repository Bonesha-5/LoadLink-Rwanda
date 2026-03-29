import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { apiRequest } from '../api/http'

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

    try {
      await apiRequest('/api/shipments', {
        method: 'POST',
        token: getToken(),
        body: {
          pickup_district:    form.origin,
          dropoff_district:   form.destination,
          pickup_description: form.pickupDescription,
          cargo_description:  form.description,
          weight:             Number(form.weight),
          offered_price:      Number(form.price),
          pickup_date:        form.date,
        },
      })
      navigate('/loads')
    } catch (err: any) {
      setErrors({ sameDistrict: err?.message || 'Could not post shipment. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  const selectCls = 'w-full rounded-2xl border bg-white px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20'
  const inputCls  = 'w-full rounded-2xl border bg-white px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20'

  return (
    <div className="space-y-6 ll-animate-in">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Post Shipment</h1>
        <p className="text-sm text-stone-600 mt-1">Create a shipment for verified companies to accept.</p>
      </div>

      <form onSubmit={onSubmit} className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 space-y-5">
        {errors.sameDistrict && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-700 font-semibold">{errors.sameDistrict}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Pickup district" error={errors.origin}>
            <select
              className={`${selectCls} ${errors.origin ? 'border-red-300' : 'border-stone-200'}`}
              value={form.origin}
              onChange={(e) => onChange('origin', e.target.value)}
            >
              <option value="">Select district</option>
              {RWANDA_DISTRICTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </Field>

          <Field label="Drop-off district" error={errors.destination}>
            <select
              className={`${selectCls} ${errors.destination ? 'border-red-300' : 'border-stone-200'}`}
              value={form.destination}
              onChange={(e) => onChange('destination', e.target.value)}
            >
              <option value="">Select district</option>
              {RWANDA_DISTRICTS.filter((d) => d !== form.origin).map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </Field>

          <Field label="Pickup description">
            <input
              className={`${inputCls} border-stone-200`}
              value={form.pickupDescription}
              onChange={(e) => onChange('pickupDescription', e.target.value)}
              placeholder="Landmark or road number"
            />
          </Field>

          <Field label="Cargo weight (tons)" error={errors.weight}>
            <input
              className={`${inputCls} ${errors.weight ? 'border-red-300' : 'border-stone-200'}`}
              type="number"
              step="0.1"
              min="0.1"
              value={form.weight}
              onChange={(e) => onChange('weight', e.target.value)}
              placeholder="e.g. 5"
            />
          </Field>

          <Field label="Offered price (RWF)" error={errors.price}>
            <input
              className={`${inputCls} ${errors.price ? 'border-red-300' : 'border-stone-200'}`}
              type="number"
              min="1"
              value={form.price}
              onChange={(e) => onChange('price', e.target.value)}
              placeholder="e.g. 150000"
            />
          </Field>

          <Field label="Pickup date" error={errors.date}>
            <input
              className={`${inputCls} ${errors.date ? 'border-red-300' : 'border-stone-200'}`}
              type="date"
              value={form.date}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => onChange('date', e.target.value)}
            />
          </Field>
        </div>

        <Field label="Cargo description">
          <textarea
            className={`${inputCls} border-stone-200 min-h-24 resize-none`}
            value={form.description}
            onChange={(e) => onChange('description', e.target.value)}
            placeholder="Describe cargo type, fragility, special handling requirements…"
          />
        </Field>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center rounded-2xl bg-accent text-sidebar px-6 py-3 font-semibold hover:bg-accent-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? 'Posting…' : 'Post Shipment'}
        </button>
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
