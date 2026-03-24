// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Load = {
  id: string
  origin: string
  destination: string
  date: string
  weight: string
  description?: string
  price?: string
  createdBy: string
  status: 'open' | 'closed'
  offers?: { companyName: string }[]
}

export type Truck = {
  id: string
  plateNumber?: string
  capacity: string
  companyName: string
}

export type Rating = {
  id: string
  truckId: string
  shipmentId: string
  shipperName: string
  stars: 1 | 2 | 3 | 4 | 5
  comment?: string
  createdAt: string
}

// ---------------------------------------------------------------------------
// Ship stage
// ---------------------------------------------------------------------------

export type ShipStage =
  | 'POSTED'
  | 'AWAITING_ESCROW'
  | 'IN_TRANSIT'
  | 'AWAITING_CONFIRMATION'
  | 'COMPLETED'
  | 'DISPUTED'

const STAGES_KEY = 'll_shipper_stages'

export function getStageMap(): Record<string, ShipStage> {
  try {
    return JSON.parse(localStorage.getItem(STAGES_KEY) ?? '{}') as Record<string, ShipStage>
  } catch {
    return {}
  }
}

export function setStageForLoad(loadId: string, stage: ShipStage) {
  const map = getStageMap()
  map[loadId] = stage
  localStorage.setItem(STAGES_KEY, JSON.stringify(map))
}

// ---------------------------------------------------------------------------
// Storage keys
// ---------------------------------------------------------------------------

const LOADS_KEY = 'll_loads'
const TRUCKS_KEY = 'll_trucks'
const RATINGS_KEY = 'll_ratings'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

// ---------------------------------------------------------------------------
// Loads
// ---------------------------------------------------------------------------

export function getAllLoads(): Load[] {
  try {
    return JSON.parse(localStorage.getItem(LOADS_KEY) ?? '[]') as Load[]
  } catch {
    return []
  }
}

function saveLoads(loads: Load[]) {
  localStorage.setItem(LOADS_KEY, JSON.stringify(loads))
}

export function addLoad(data: Omit<Load, 'id' | 'status' | 'offers'>): Load {
  const loads = getAllLoads()
  const newLoad: Load = { ...data, id: uid(), status: 'open', offers: [] }
  loads.push(newLoad)
  saveLoads(loads)
  return newLoad
}

export function ensureSeedLoads() {
  const existing = getAllLoads()
  if (existing.length > 0) return

  const seeds: Load[] = [
    {
      id: uid(),
      origin: 'Kigali',
      destination: 'Musanze',
      date: new Date().toISOString().slice(0, 10),
      weight: '5 tons',
      description: 'Electronics cargo — fragile',
      price: '150,000 RWF',
      createdBy: 'Shipper',
      status: 'open',
      offers: [{ companyName: 'Kigali Freight Ltd' }, { companyName: 'RwandaMove Co.' }],
    },
    {
      id: uid(),
      origin: 'Huye',
      destination: 'Rubavu',
      date: new Date().toISOString().slice(0, 10),
      weight: '10 tons',
      description: 'Agricultural produce',
      price: '320,000 RWF',
      createdBy: 'Shipper',
      status: 'open',
      offers: [{ companyName: 'Kigali Freight Ltd' }],
    },
  ]
  saveLoads(seeds)
}

// ---------------------------------------------------------------------------
// Trucks
// ---------------------------------------------------------------------------

export function getAllTrucks(): Truck[] {
  try {
    const stored = JSON.parse(localStorage.getItem(TRUCKS_KEY) ?? '[]') as Truck[]
    if (stored.length > 0) return stored
    return getSeedTrucks()
  } catch {
    return getSeedTrucks()
  }
}

function getSeedTrucks(): Truck[] {
  return [
    { id: 'truck-1', plateNumber: 'RAA 001 A', capacity: '10 tons', companyName: 'Kigali Freight Ltd' },
    { id: 'truck-2', plateNumber: 'RAB 002 B', capacity: '5 tons', companyName: 'Kigali Freight Ltd' },
    { id: 'truck-3', plateNumber: 'RAC 003 C', capacity: '15 tons', companyName: 'RwandaMove Co.' },
    { id: 'truck-4', plateNumber: 'RAD 004 D', capacity: '8 tons', companyName: 'RwandaMove Co.' },
  ]
}

export function getTrucksByCompany(companyName: string): Truck[] {
  return getAllTrucks().filter((t) => t.companyName === companyName)
}

// ---------------------------------------------------------------------------
// Ratings
// ---------------------------------------------------------------------------

export function getAllRatings(): Rating[] {
  try {
    return JSON.parse(localStorage.getItem(RATINGS_KEY) ?? '[]') as Rating[]
  } catch {
    return []
  }
}

export function getRatingsByTruck(truckId: string): Rating[] {
  return getAllRatings().filter((r) => r.truckId === truckId)
}

export function getTruckRatingAverage(truckId: string): number | null {
  const ratings = getRatingsByTruck(truckId)
  if (ratings.length === 0) return null
  const sum = ratings.reduce((acc, r) => acc + r.stars, 0)
  return Math.round((sum / ratings.length) * 10) / 10
}

export function addRating(data: Omit<Rating, 'id' | 'createdAt'>): Rating {
  const ratings = getAllRatings()
  const newRating: Rating = { ...data, id: uid(), createdAt: new Date().toISOString() }
  ratings.push(newRating)
  localStorage.setItem(RATINGS_KEY, JSON.stringify(ratings))
  return newRating
}
