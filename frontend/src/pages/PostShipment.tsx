import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { addLoad, setStageForLoad } from '../data/storage'

export default function PostShipment() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [form, setForm] = useState({
    origin: '',
    destination: '',
    pickupDescription: '',
    description: '',
    weight: '',
    price: '',
    date: '',
  })

  const onChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.origin || !form.destination || !form.weight || !form.price || !form.date) return
    const newLoad = addLoad({
      origin: form.origin,
      destination: form.destination,
      date: form.date,
      weight: `${form.weight} tons`,
      description: [form.pickupDescription, form.description].filter(Boolean).join(' | '),
      price: `${form.price} RWF`,
      createdBy: user?.name || 'Shipper',
    })
    setStageForLoad(newLoad.id, 'POSTED')
    navigate('/loads')
  }

  return (
    <div className="space-y-6 ll-animate-in">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Post Shipment</h1>
        <p className="text-sm text-stone-600 mt-1">Create a shipment for verified companies to accept.</p>
      </div>

      <form onSubmit={onSubmit} className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Pickup district">
          <input className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20" value={form.origin} onChange={(e) => onChange('origin', e.target.value)} />
        </Field>
        <Field label="Drop-off district">
          <input className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20" value={form.destination} onChange={(e) => onChange('destination', e.target.value)} />
        </Field>
        <Field label="Pickup description">
          <input className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20" value={form.pickupDescription} onChange={(e) => onChange('pickupDescription', e.target.value)} placeholder="Landmark or road number" />
        </Field>
        <Field label="Cargo weight (tons)">
          <input className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20" type="number" step="0.1" value={form.weight} onChange={(e) => onChange('weight', e.target.value)} />
        </Field>
        <Field label="Offered price (RWF)">
          <input className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20" type="number" value={form.price} onChange={(e) => onChange('price', e.target.value)} />
        </Field>
        <Field label="Pickup date">
          <input className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20" type="date" value={form.date} onChange={(e) => onChange('date', e.target.value)} />
        </Field>
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-stone-700 mb-2">Cargo description</label>
          <textarea className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 min-h-24" value={form.description} onChange={(e) => onChange('description', e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <button type="submit" className="inline-flex items-center rounded-2xl bg-accent text-sidebar px-5 py-3 font-semibold hover:bg-accent-hover transition-colors">
            POST SHIPMENT
          </button>
        </div>
      </form>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-stone-700 mb-2">{label}</span>
      {children}
    </label>
  )
}
