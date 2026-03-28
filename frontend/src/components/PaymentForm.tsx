import { useState } from 'react'

type PaymentFormProps = {
  amount: number
  onSuccess?: () => void
}

export default function PaymentForm({ amount, onSuccess }: PaymentFormProps) {
  const [phone, setPhone] = useState('')
  const [provider, setProvider] = useState<'mtn' | 'airtel'>('mtn')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // TODO: process mobile money payment
    onSuccess?.()
  }

  return (
    <form onSubmit={handleSubmit}>
      <select value={provider} onChange={(e) => setProvider(e.target.value as 'mtn' | 'airtel')}>
        <option value="mtn">MTN Mobile Money</option>
        <option value="airtel">Airtel Money</option>
      </select>
      <input
        placeholder="Phone number"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <p>Amount: {amount} RWF</p>
      <button type="submit">Pay</button>
    </form>
  )
}
