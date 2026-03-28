import { useState } from 'react'

export default function TruckForm() {
  const [capacity, setCapacity] = useState('')
  const [location, setLocation] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // TODO: submit truck
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        placeholder="Capacity (tons)"
        value={capacity}
        onChange={(e) => setCapacity(e.target.value)}
      />
      <input
        placeholder="Location"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
      />
      <button type="submit">Add Truck</button>
    </form>
  )
}
