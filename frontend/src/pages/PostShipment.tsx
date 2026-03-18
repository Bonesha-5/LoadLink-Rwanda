import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const RWANDA_DISTRICTS = [
  'Bugesera','Burera','Gakenke','Gasabo','Gatsibo','Gicumbi','Gisagara',
  'Huye','Kamonyi','Karongi','Kayonza','Kicukiro','Kirehe','Muhanga',
  'Musanze','Ngoma','Ngororero','Nyabihu','Nyagatare','Nyamagabe',
  'Nyamasheke','Nyanza','Nyarugenge','Nyaruguru','Rubavu','Ruhango',
  'Rulindo','Rusizi','Rutsiro','Rwamagana',
]

type FormData = {
  pickup_district: string
  dropoff_district: string
  pickup_description: string
  cargo_description: string
  weight: string
  offered_price: string
  pickup_date: string
}

const EMPTY: FormData = {
  pickup_district: '',
  dropoff_district: '',
  pickup_description: '',
  cargo_description: '',
  weight: '',
  offered_price: '',
  pickup_date: '',
}

export default function PostShipment() {
  const [form, setForm] = useState<FormData>(EMPTY)
  const [errors, setErrors] = useState<Partial<FormData>>({})
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  function validate() {
    const e: Partial<FormData> = {}
    if (!form.pickup_district) e.pickup_district = 'Required'
    if (!form.dropoff_district) e.dropoff_district = 'Required'
    if (!form.pickup_description.trim()) e.pickup_description = 'Required'
    if (!form.cargo_description.trim()) e.cargo_description = 'Required'
    if (!form.weight || Number(form.weight) <= 0) e.weight = 'Enter a valid weight'
    if (!form.offered_price || Number(form.offered_price) <= 0) e.offered_price = 'Enter a valid price'
    if (!form.pickup_date) e.pickup_date = 'Required'
    return e
  }

  function set(field: keyof FormData, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
    setErrors((e) => ({ ...e, [field]: undefined }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSubmitting(true)
    try {
      const token = localStorage.getItem('loadlink_shipper')
      const res = await fetch('/api/shipments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token ? JSON.parse(token).token : ''}`,
        },
        body: JSON.stringify({
          ...form,
          weight: Number(form.weight),
          offered_price: Number(form.offered_price),
        }),
      })
      if (!res.ok) throw new Error()
      navigate('/loads')
    } catch {
      alert('Failed to post shipment. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const field = (label: string, key: keyof FormData, input: React.ReactNode) => (
    <div>
      <label className="block text-sm font-semibold text-stone-700 mb-1.5">{label}</label>
      {input}
      {errors[key] && <p className="text-red-500 text-xs mt-1">{errors[key]}</p>}
    </div>
  )

  const selectCls = (err?: string) =>
    `w-full px-4 py-3 rounded-xl bg-stone-50 border ${err ? 'border-red-400' : 'border-stone-200'} text-stone-800 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all`

  const inputCls = (err?: string) =>
    `w-full px-4 py-3 rounded-xl bg-stone-50 border ${err ? 'border-red-400' : 'border-stone-200'} text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all`

  const districtSelect = (key: 'pickup_district' | 'dropoff_district') => (
    <select value={form[key]} onChange={(e) => set(key, e.target.value)} className={selectCls(errors[key])}>
      <option value="">Select district</option>
      {RWANDA_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
    </select>
  )

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-stone-800 mb-1">Post a Shipment</h1>
      <p className="text-stone-500 mb-6">Fill in the details and we'll match you with available trucks.</p>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-stone-200 p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          {field('Pickup District', 'pickup_district', districtSelect('pickup_district'))}
          {field('Dropoff District', 'dropoff_district', districtSelect('dropoff_district'))}
        </div>

        {field('Pickup Description', 'pickup_description',
          <input
            type="text"
            placeholder="e.g. Near Kigali Convention Centre gate 2"
            value={form.pickup_description}
            onChange={(e) => set('pickup_description', e.target.value)}
            className={inputCls(errors.pickup_description)}
          />
        )}

        {field('Cargo Description', 'cargo_description',
          <input
            type="text"
            placeholder="e.g. Bags of cement, fragile electronics..."
            value={form.cargo_description}
            onChange={(e) => set('cargo_description', e.target.value)}
            className={inputCls(errors.cargo_description)}
          />
        )}

        <div className="grid grid-cols-2 gap-4">
          {field('Weight (tons)', 'weight',
            <input
              type="number"
              min="0.1"
              step="0.1"
              placeholder="e.g. 5"
              value={form.weight}
              onChange={(e) => set('weight', e.target.value)}
              className={inputCls(errors.weight)}
            />
          )}
          {field('Offered Price (RWF)', 'offered_price',
            <input
              type="number"
              min="1"
              placeholder="e.g. 150000"
              value={form.offered_price}
              onChange={(e) => set('offered_price', e.target.value)}
              className={inputCls(errors.offered_price)}
            />
          )}
        </div>

        {field('Pickup Date', 'pickup_date',
          <input
            type="date"
            min={new Date().toISOString().split('T')[0]}
            value={form.pickup_date}
            onChange={(e) => set('pickup_date', e.target.value)}
            className={inputCls(errors.pickup_date)}
          />
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-3 bg-accent text-white font-semibold rounded-xl hover:bg-accent-hover transition-all shadow-lg shadow-accent/25 disabled:opacity-60"
          >
            {submitting ? 'Posting...' : 'Post Shipment'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/loads')}
            className="px-5 py-3 border border-stone-200 text-stone-700 font-semibold rounded-xl hover:bg-stone-50 transition-all"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
