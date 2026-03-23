import CustomerShipmentMap from '../components/CustomerShipmentMap'

export default function Profile() {
  const pickup: [number, number] = [-1.9536, 30.0605]   // Kigali
  const dropoff: [number, number] = [-1.7028, 29.2569]  // Gisenyi
  const truck: [number, number] = [-1.85, 29.7]         // somewhere in between

  return (
    <div className="max-w-3xl space-y-8">
      {/* existing welcome + buttons */}

      <section>
        <h2 className="text-lg font-semibold text-stone-800 mb-2">
          Live shipment map (demo)
        </h2>
        <p className="text-sm text-stone-600 mb-3">
          Visualize the route and current truck position for your active shipment.
        </p>
        <CustomerShipmentMap pickup={pickup} dropoff={dropoff} truck={truck} />
      </section>
    </div>
  )
}
