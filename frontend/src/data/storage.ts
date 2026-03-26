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
  pickupAddress?: string
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
  type?: string
  phone?: string
  email?: string
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
  | 'CANCELLED'

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

export function ensureSeedLoads(userName = 'Shipper') {
  const existing = getAllLoads()
  const s1 = existing.find((l) => l.id === 's1')

  // If seeds exist but belong to a different user, re-assign them
  if (s1) {
    if (s1.createdBy !== userName) {
      const updated = existing.map((l) =>
        (['s1', 's2', 's3'].includes(l.id)) ? { ...l, createdBy: userName } : l
      )
      saveLoads(updated)
    }
    // Add s3 if missing
    if (!existing.find((l) => l.id === 's3')) {
      const loads = getAllLoads()
      loads.splice(2, 0, {
        id: 's3',
        origin: 'Rubavu',
        destination: 'Musanze',
        date: '2026-03-20',
        weight: '3 tons',
        description: 'Electronic goods',
        pickupAddress: 'Rubavu Port, Lake Kivu Road',
        price: 'RWF 120,000',
        createdBy: userName,
        status: 'open',
        offers: [{ companyName: 'Fast Move Transport' }],
      })
      saveLoads(loads)
    }
    // Always enforce correct stages for seed loads
    const stageMap = getStageMap()
    stageMap['s1'] = 'AWAITING_ESCROW'
    stageMap['s2'] = 'AWAITING_CONFIRMATION'
    stageMap['s3'] = 'POSTED'
    localStorage.setItem(STAGES_KEY, JSON.stringify(stageMap))

    // Clear any stale ratings for seed loads so the rating UI always shows fresh
    const ratings = getAllRatings().filter((r) => !['s1', 's2', 's3'].includes(r.shipmentId))
    localStorage.setItem(RATINGS_KEY, JSON.stringify(ratings))
    return
  }

  const nonSeed = existing.filter((l) => !['s1', 's2', 's3'].includes(l.id))
  const seeds: Load[] = [
    {
      id: 's1',
      origin: 'Kigali',
      destination: 'Musanze',
      date: '2026-03-10',
      weight: '8 tons',
      description: 'Construction materials - cement bags and iron sheets',
      pickupAddress: 'Near Nyabugogo Market, KN 3 Road',
      price: 'RWF 250,000',
      createdBy: userName,
      status: 'open',
      offers: [
        { companyName: 'Fast Move Transport' },
        { companyName: 'Rwanda Trans Co.' },
        { companyName: 'Kigali Express Logistics' },
      ],
    },
    {
      id: 's2',
      origin: 'Huye',
      destination: 'Kigali',
      date: '2026-03-05',
      weight: '5 tons',
      description: 'Agricultural produce — fresh vegetables',
      pickupAddress: 'Huye Market, Near Bus Park',
      price: 'RWF 180,000',
      createdBy: userName,
      status: 'closed',
      offers: [],
    },
    {
      id: 's3',
      origin: 'Rubavu',
      destination: 'Musanze',
      date: '2026-03-20',
      weight: '3 tons',
      description: 'Electronic goods',
      pickupAddress: 'Rubavu Port, Lake Kivu Road',
      price: 'RWF 120,000',
      createdBy: userName,
      status: 'open',
      offers: [{ companyName: 'Fast Move Transport' }],
    },
    ...nonSeed,
  ]
  saveLoads(seeds)

  // Set stages for seed loads
  const stageMap = getStageMap()
  stageMap['s1'] = 'AWAITING_ESCROW'
  stageMap['s2'] = 'AWAITING_CONFIRMATION'
  stageMap['s3'] = 'POSTED'
  localStorage.setItem(STAGES_KEY, JSON.stringify(stageMap))
}

// ---------------------------------------------------------------------------
// Trucks
// ---------------------------------------------------------------------------

export function getAllTrucks(): Truck[] {
  return getSeedTrucks()
}

function getSeedTrucks(): Truck[] {
  return [
    { id: 'truck-1', plateNumber: 'RAF 789 C', capacity: '9 tons',  companyName: 'Fast Move Transport',     type: 'Box Truck',    phone: '+250788345678', email: 'info@fastmove.rw' },
    { id: 'truck-2', plateNumber: 'RAE 456 B', capacity: '12 tons', companyName: 'Rwanda Trans Co.',         type: 'Refrigerated', phone: '+250788234567', email: 'contact@rwandatrans.rw' },
    { id: 'truck-3', plateNumber: 'RAD 123 A', capacity: '10 tons', companyName: 'Kigali Express Logistics', type: 'Flatbed',      phone: '+250788123456', email: 'info@kigaliexpress.rw' },
    { id: 'truck-4', plateNumber: 'RAA 001 A', capacity: '10 tons', companyName: 'Kigali Freight Ltd',       type: 'Box Truck',    phone: '+250788000001', email: 'info@kigalifreight.rw' },
    { id: 'truck-5', plateNumber: 'RAC 003 C', capacity: '15 tons', companyName: 'RwandaMove Co.',           type: 'Flatbed',      phone: '+250788000002', email: 'info@rwandamove.rw' },
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
