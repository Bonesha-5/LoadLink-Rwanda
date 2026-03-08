/**
 * Frontend-only storage for loads (shipments) and company trucks.
 * Uses localStorage so data persists across sessions.
 */

const LOADS_KEY = 'loadlink_loads'
const TRUCKS_KEY = 'loadlink_company_trucks'

// --- Loads (shipments posted by shippers) ---

export type LoadOffer = {
  id: string
  companyName: string
  amount: string
  message?: string
}

export type Load = {
  id: string
  origin: string
  destination: string
  date: string
  weight: string
  description?: string
  price?: string
  status: string
  createdBy: string
  offers: LoadOffer[]
}

function nextId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

function getLoads(): Load[] {
  try {
    const raw = localStorage.getItem(LOADS_KEY)
    if (!raw) return getSeedLoads()
    const parsed = JSON.parse(raw) as Load[]
    return Array.isArray(parsed) ? parsed : getSeedLoads()
  } catch {
    return getSeedLoads()
  }
}

function getSeedLoads(): Load[] {
  const seed: Load[] = [
    {
      id: nextId('load'),
      origin: 'Kigali',
      destination: 'Gisenyi',
      date: '2025-03-15',
      weight: '5 tons',
      description: 'General cargo, palletized.',
      status: 'open',
      createdBy: 'Demo Shipper',
      offers: [],
    },
    {
      id: nextId('load'),
      origin: 'Kigali',
      destination: 'Butare',
      date: '2025-03-18',
      weight: '12 tons',
      description: 'Construction materials.',
      status: 'open',
      createdBy: 'Demo Shipper',
      offers: [],
    },
    {
      id: nextId('load'),
      origin: 'Musanze',
      destination: 'Kigali',
      date: '2025-03-20',
      weight: '8 tons',
      status: 'open',
      createdBy: 'Demo Shipper',
      offers: [],
    },
  ]
  localStorage.setItem(LOADS_KEY, JSON.stringify(seed))
  return seed
}

export function getAllLoads(): Load[] {
  return getLoads()
}

export function getLoadById(id: string): Load | undefined {
  return getLoads().find((l) => l.id === id)
}

export function addOfferToLoad(loadId: string, companyName: string, amount: string, message?: string): void {
  const loads = getLoads()
  const load = loads.find((l) => l.id === loadId)
  if (!load) return
  const offer: LoadOffer = {
    id: nextId('offer'),
    companyName,
    amount,
    message,
  }
  load.offers = load.offers || []
  load.offers.push(offer)
  const updated = loads.map((l) => (l.id === loadId ? load : l))
  localStorage.setItem(LOADS_KEY, JSON.stringify(updated))
}

export function addLoad(load: Omit<Load, 'id' | 'offers'>): Load {
  const loads = getLoads()
  const newLoad: Load = {
    ...load,
    id: nextId('load'),
    offers: [],
  }
  loads.push(newLoad)
  localStorage.setItem(LOADS_KEY, JSON.stringify(loads))
  return newLoad
}

// --- Company trucks ---

export type Truck = {
  id: string
  companyName: string
  capacity: string
  location: string
  plateNumber?: string
}

function getTrucks(): Truck[] {
  try {
    const raw = localStorage.getItem(TRUCKS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Truck[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function getTrucksByCompany(companyName: string): Truck[] {
  return getTrucks().filter((t) => t.companyName === companyName)
}

export function addTruck(truck: Omit<Truck, 'id'>): Truck {
  const trucks = getTrucks()
  const newTruck: Truck = {
    ...truck,
    id: nextId('truck'),
  }
  trucks.push(newTruck)
  localStorage.setItem(TRUCKS_KEY, JSON.stringify(trucks))
  return newTruck
}

export function deleteTruck(id: string): void {
  const trucks = getTrucks().filter((t) => t.id !== id)
  localStorage.setItem(TRUCKS_KEY, JSON.stringify(trucks))
}
