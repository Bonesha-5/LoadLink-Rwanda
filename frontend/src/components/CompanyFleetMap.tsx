import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import type { LatLngExpression } from 'leaflet'

type FleetTruck = {
  id: string
  position: LatLngExpression
}

type Props = {
  trucks: FleetTruck[]
}

export default function CompanyFleetMap({ trucks }: Props) {
  const center: LatLngExpression = trucks[0]?.position ?? [-1.9536, 30.0605] // Kigali fallback

  return (
    <div className="rounded-2xl overflow-hidden border border-stone-200 bg-white shadow-sm h-64">
      <MapContainer center={center} zoom={7} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {trucks.map((t) => (
          <Marker key={t.id} position={t.position} />
        ))}
      </MapContainer>
    </div>
  )
}

