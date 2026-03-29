import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet'
import type { LatLngExpression } from 'leaflet'

type Props = {
  pickup: LatLngExpression
  dropoff: LatLngExpression
  truck?: LatLngExpression
}

export default function CustomerShipmentMap({ pickup, dropoff, truck }: Props) {
  const center = truck || pickup

  return (
    <div className="rounded-2xl overflow-hidden border border-stone-200 bg-white shadow-sm h-72">
      <MapContainer center={center} zoom={8} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={pickup} />
        <Marker position={dropoff} />
        {truck && <Marker position={truck} />}
        <Polyline positions={[pickup, dropoff]} pathOptions={{ color: '#F5C518', weight: 3, opacity: 0.9 }} />
      </MapContainer>
    </div>
  )
}