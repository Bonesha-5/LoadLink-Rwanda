export type Offer = {
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
  createdBy: string
  status: 'open' | 'closed'
  offers?: Offer[]
}

export type Truck = {
  id: string
  companyName: string
  capacity: string
  location: string
  plateNumber?: string
}

const LOADS_KEY = 'loadlink_loads'
const TRUCKS_KEY = 'loadlink_trucks'

export function getAllLoads(): Load[] {
  try {
    return JSON.parse(localStorage.getItem(LOADS_KEY) ?? '[]')
  } catch {
    return []
  }
}

function saveLoads(loads: Load[]) {
  localStorage.setItem(LOADS_KEY, JSON.stringify(loads))
}

export function addOfferToLoad(loadId: string, companyName: string, amount: string, message?: string) {
  const loads = getAllLoads()
  const load = loads.find((l) => l.id === loadId)
  if (!load) return
  load.offers = [...(load.offers ?? []), { companyName, amount, message }]
  saveLoads(loads)
}

export function getTrucksByCompany(companyName: string): Truck[] {
  try {
    const all: Truck[] = JSON.parse(localStorage.getItem(TRUCKS_KEY) ?? '[]')
    return all.filter((t) => t.companyName === companyName)
  } catch {
    return []
  }
}

export function addTruck(truck: Omit<Truck, 'id'>) {
  const all: Truck[] = JSON.parse(localStorage.getItem(TRUCKS_KEY) ?? '[]')
  const newTruck: Truck = { ...truck, id: crypto.randomUUID() }
  localStorage.setItem(TRUCKS_KEY, JSON.stringify([...all, newTruck]))
}

export function deleteTruck(id: string) {
  const all: Truck[] = JSON.parse(localStorage.getItem(TRUCKS_KEY) ?? '[]')
  localStorage.setItem(TRUCKS_KEY, JSON.stringify(all.filter((t) => t.id !== id)))
}
