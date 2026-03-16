/**
 * Frontend-only storage (localStorage).
 *
 * Important: avoid side-effects at import time. Some environments block
 * localStorage access, which can crash rendering if we eagerly write/read.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export interface Truck {
  id: string
  companyName: string
  capacity: string
  location: string
  plateNumber?: string
}

export interface Offer {
  id: string
  companyName: string
  amount: string
  message?: string
  createdAt: string
}

export interface Load {
  id: string
  origin: string
  destination: string
  date: string
  weight: string
  description?: string
  // Fixed price set by the shipper (e.g. "150,000 RWF")
  price?: string
  status: 'open' | 'closed'
  createdBy: string
  offers?: Offer[]
}

// ── Helpers ────────────────────────────────────────────────────────────────

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function safeParseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function safeSetItem(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore (storage blocked/disabled/quota exceeded)
  }
}

// ── Trucks ─────────────────────────────────────────────────────────────────

const TRUCKS_KEY = 'll_trucks'

function getAllTrucks(): Truck[] {
  try {
    return safeParseJson<Truck[]>(localStorage.getItem(TRUCKS_KEY), [])
  } catch {
    return []
  }
}

function saveTrucks(trucks: Truck[]): void {
  safeSetItem(TRUCKS_KEY, trucks)
}

export function getTrucksByCompany(companyName: string): Truck[] {
  return getAllTrucks().filter((t) => t.companyName === companyName)
}

export function addTruck(data: Omit<Truck, 'id'>): Truck {
  const truck: Truck = { id: uid(), ...data }
  saveTrucks([...getAllTrucks(), truck])
  return truck
}

export function deleteTruck(id: string): void {
  saveTrucks(getAllTrucks().filter((t) => t.id !== id))
}

// ── Loads ──────────────────────────────────────────────────────────────────

const LOADS_KEY = 'll_loads'

export function getAllLoads(): Load[] {
  try {
    return safeParseJson<Load[]>(localStorage.getItem(LOADS_KEY), [])
  } catch {
    return []
  }
}

function saveLoads(loads: Load[]): void {
  safeSetItem(LOADS_KEY, loads)
}

export function addLoad(data: Omit<Load, 'id' | 'status' | 'offers'>): Load {
  const load: Load = { id: uid(), status: 'open', offers: [], ...data }
  saveLoads([...getAllLoads(), load])
  return load
}

export function addOfferToLoad(
  loadId: string,
  companyName: string,
  amount: string,
  message?: string,
): void {
  const loads = getAllLoads()
  const idx = loads.findIndex((l) => l.id === loadId)
  if (idx === -1) return
  const offer: Offer = {
    id: uid(),
    companyName,
    amount,
    message,
    createdAt: new Date().toISOString(),
  }
  loads[idx] = { ...loads[idx], offers: [...(loads[idx].offers ?? []), offer] }
  saveLoads(loads)
}

export function ensureSeedLoads(): void {
  const existing = getAllLoads()
  if (existing.length > 0) return
  const seed: Load[] = [
    {
      id: uid(),
      origin: 'Kigali',
      destination: 'Gisenyi',
      date: '2026-03-15',
      weight: '5 tons',
      description: 'General cargo, palletized.',
      price: '150,000 RWF',
      status: 'open',
      createdBy: 'Demo Shipper',
      offers: [],
    },
    {
      id: uid(),
      origin: 'Kigali',
      destination: 'Butare',
      date: '2026-03-18',
      weight: '12 tons',
      description: 'Construction materials.',
      price: '320,000 RWF',
      status: 'open',
      createdBy: 'Demo Shipper',
      offers: [],
    },
    {
      id: uid(),
      origin: 'Musanze',
      destination: 'Kigali',
      date: '2026-03-20',
      weight: '8 tons',
      price: '240,000 RWF',
      status: 'open',
      createdBy: 'Demo Shipper',
      offers: [],
    },
  ]
  saveLoads(seed)
}
