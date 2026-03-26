import { useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, Tooltip } from 'react-leaflet'
import L from 'leaflet'
import type { LatLngExpression } from 'leaflet'

const redTruckIcon = L.divIcon({
  html: `<div style="
    width:38px;height:38px;
    background:#DC2626;
    border-radius:50%;
    border:2px solid white;
    box-shadow:0 2px 8px rgba(0,0,0,0.4);
    display:flex;align-items:center;justify-content:center;
  ">
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="white">
      <rect x="1" y="3" width="15" height="13"/>
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
      <circle cx="5.5" cy="18.5" r="2.5" fill="#DC2626" stroke="white" stroke-width="1.5"/>
      <circle cx="18.5" cy="18.5" r="2.5" fill="#DC2626" stroke="white" stroke-width="1.5"/>
    </svg>
  </div>`,
  className: '',
  iconSize: [38, 38],
  iconAnchor: [19, 19],
})

export type ShipmentMarker = {
  id: string
  pickup: [number, number]
  dropoff: [number, number]
  truck?: [number, number]
  label: string
}

type Props = {
  shipments: ShipmentMarker[]
}

export default function CustomerShipmentMap({ shipments }: Props) {
  const center = useMemo<LatLngExpression>(() => {
    if (shipments.length === 0) return [-1.9441, 30.0619]
    const pts = shipments.flatMap((s) => [s.pickup, s.dropoff])
    const lat = pts.reduce((sum, p) => sum + p[0], 0) / pts.length
    const lng = pts.reduce((sum, p) => sum + p[1], 0) / pts.length
    return [lat, lng]
  }, [shipments])

  return (
    <div className="rounded-2xl overflow-hidden border border-stone-200 bg-white shadow-sm h-72">
      <MapContainer center={center} zoom={8} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {shipments.map((s) => (
          <span key={s.id}>
            <Marker position={s.pickup}>
              <Tooltip direction="top" offset={[0, -10]} opacity={0.9}>{s.label} · Pickup</Tooltip>
            </Marker>
            <Marker position={s.dropoff}>
              <Tooltip direction="top" offset={[0, -10]} opacity={0.9}>{s.label} · Drop-off</Tooltip>
            </Marker>
            {s.truck && (
              <Marker position={s.truck} icon={redTruckIcon}>
                <Tooltip direction="top" offset={[0, -22]} opacity={0.95}>{s.label}</Tooltip>
              </Marker>
            )}
            <Polyline positions={[s.pickup, s.dropoff]} pathOptions={{ color: '#C49B1A', weight: 3, opacity: 0.9 }}>
              <Tooltip sticky opacity={0.9}>{s.label}</Tooltip>
            </Polyline>
          </span>
        ))}
      </MapContainer>
    </div>
  )
}
