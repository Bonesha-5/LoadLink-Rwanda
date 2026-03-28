import { MapContainer, TileLayer, Marker, Polyline, ZoomControl } from 'react-leaflet'
import L from 'leaflet'
import type { LatLngExpression } from 'leaflet'

type FleetTruck = {
  id: string
  position: LatLngExpression
}

type Props = {
  trucks: FleetTruck[]
  heightClassName?: string
  route?: LatLngExpression[]
  movingTruckPosition?: LatLngExpression | null
}

export default function CompanyFleetMap({ trucks, heightClassName, route, movingTruckPosition }: Props) {
  const center: LatLngExpression = trucks[0]?.position ?? [-1.9536, 30.0605] // Kigali fallback
  const path = route && route.length ? route : trucks.map((t) => t.position)

  const truckDotIcon = L.divIcon({
    className: '',
    html: `
      <div style="
        width: 14px;
        height: 14px;
        border-radius: 999px;
        background: rgba(245,197,24,0.95);
        border: 2px solid white;
        box-shadow: 0 8px 18px rgba(0,0,0,0.18);
      "></div>
    `,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  })

  const movingTruckIcon = L.divIcon({
    className: '',
    html: `
      <div style="
        width: 34px;
        height: 34px;
        border-radius: 999px;
        background: rgba(255,255,255,0.92);
        border: 1px solid rgba(0,0,0,0.08);
        box-shadow: 0 14px 28px rgba(0,0,0,0.18);
        display:flex;
        align-items:center;
        justify-content:center;
      ">
        <div style="
          width: 22px;
          height: 22px;
          border-radius: 999px;
          background: rgba(245,197,24,0.2);
          display:flex;
          align-items:center;
          justify-content:center;
        ">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(245,197,24,0.95)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="1" y="3" width="15" height="13"></rect>
            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
            <circle cx="5.5" cy="18.5" r="2.5"></circle>
            <circle cx="18.5" cy="18.5" r="2.5"></circle>
          </svg>
        </div>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  })

  return (
    <div className={`relative w-full ${heightClassName ?? 'h-full'}`}>
      <MapContainer
        center={center}
        zoom={8}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        attributionControl={false}
      >
        <ZoomControl position="bottomright" />
        <TileLayer
          attribution="&copy; OpenStreetMap contributors &copy; CARTO"
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        {path.length >= 2 && (
          <Polyline
            positions={path}
            pathOptions={{ color: '#F5C518', weight: 4, opacity: 0.95 }}
          />
        )}

        {movingTruckPosition && (
          <Marker position={movingTruckPosition} icon={movingTruckIcon} />
        )}

        {trucks.map((t) => (
          <Marker key={t.id} position={t.position} icon={truckDotIcon} />
        ))}
      </MapContainer>

      <div className="absolute bottom-2 left-2 rounded-xl bg-white/90 backdrop-blur px-2 py-1 border border-stone-200 text-[10px] text-stone-600">
        © OpenStreetMap · © CARTO
      </div>
    </div>
  )
}

