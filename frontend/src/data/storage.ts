/** Local demo storage (localStorage). Avoid side-effects at import time. */

export type Offer = {
  id?: string
  companyName: string
  amount?: string
  message?: string
  createdAt?: string
}

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
  offers?: Offer[]
}

export type Truck = {
  id: string
  plateNumber?: string
  capacity: string
  location?: string
  companyName: string
  type?: string
  phone?: string
  email?: string
}

export type Rating = {
  id: string
  truckId: string
  shipmentId?: string
  shipperName: string
  stars: 1 | 2 | 3 | 4 | 5
  comment?: string
  createdAt: string
}

export type ShipStage =
  | 'POSTED'
  | 'AWAITING_ESCROW'
  | 'IN_TRANSIT'
  | 'AWAITING_CONFIRMATION'
  | 'COMPLETED'
  | 'DISPUTED'
  | 'CANCELLED'

const STAGES_KEY = 'll_shipper_stages'
const LOADS_KEY = 'll_loads'
const RATINGS_KEY = 'll_ratings'
const TRUCKS_KEY = 'll_trucks'

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
    // storage may be disabled or full in some browsers
  }
}

export function getStageMap(): Record<string, ShipStage> {
  return safeParseJson<Record<string, ShipStage>>(localStorage.getItem(STAGES_KEY), {})
}

export function setStageForLoad(loadId: string, stage: ShipStage): void {
  const map = getStageMap()
  map[loadId] = stage
  safeSetItem(STAGES_KEY, map)
}

export function getAllLoads(): Load[] {
  return safeParseJson<Load[]>(localStorage.getItem(LOADS_KEY), [])
}

function saveLoads(loads: Load[]): void {
  safeSetItem(LOADS_KEY, loads)
}

export function addLoad(data: Omit<Load, 'id' | 'status' | 'offers'>): Load {
  const loads = getAllLoads()
  const newLoad: Load = { ...data, id: uid(), status: 'open', offers: [] }
  loads.push(newLoad)
  saveLoads(loads)
  return newLoad
}

export function addOfferToLoad(loadId: string, companyName: string, amount: string, message?: string): void {
  const loads = getAllLoads()
  const idx = loads.findIndex((l) => l.id === loadId)
  if (idx === -1) return
  const offer: Offer = { id: uid(), companyName, amount, message, createdAt: new Date().toISOString() }
  loads[idx] = { ...loads[idx], offers: [...(loads[idx].offers ?? []), offer] }
  saveLoads(loads)
}

export function ensureSeedLoads(userName = 'Shipper'): void {
  const existing = getAllLoads()
  const s1 = existing.find((l) => l.id === 's1')

  if (s1) {
    if (s1.createdBy !== userName) {
      const updated = existing.map((l) =>
        l.id === 's1' || l.id === 's2' ? { ...l, createdBy: userName } : l,
      )
      saveLoads(updated)
    }
    return
  }

  const nonSeed = existing.filter((l) => l.id !== 's1' && l.id !== 's2')
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
      description: 'Agricultural produce - fresh vegetables',
      pickupAddress: 'Huye Market, Near Bus Park',
      price: 'RWF 180,000',
      createdBy: userName,
      status: 'closed',
      offers: [],
    },
    ...nonSeed,
  ]
  saveLoads(seeds)
}

function getSeedTrucks(): Truck[] {
  return [
    { id: 'truck-1', plateNumber: 'RAF 789 C', capacity: '9 tons', companyName: 'Fast Move Transport', type: 'Box Truck', phone: '+250788345678', email: 'info@fastmove.rw' },
    { id: 'truck-2', plateNumber: 'RAE 456 B', capacity: '12 tons', companyName: 'Rwanda Trans Co.', type: 'Refrigerated', phone: '+250788234567', email: 'contact@rwandatrans.rw' },
    { id: 'truck-3', plateNumber: 'RAD 123 A', capacity: '10 tons', companyName: 'Kigali Express Logistics', type: 'Flatbed', phone: '+250788123456', email: 'info@kigaliexpress.rw' },
    { id: 'truck-4', plateNumber: 'RAA 001 A', capacity: '10 tons', companyName: 'Kigali Freight Ltd', type: 'Box Truck', phone: '+250788000001', email: 'info@kigalifreight.rw' },
    { id: 'truck-5', plateNumber: 'RAC 003 C', capacity: '15 tons', companyName: 'RwandaMove Co.', type: 'Flatbed', phone: '+250788000002', email: 'info@rwandamove.rw' },
  ]
}

export function getAllTrucks(): Truck[] {
  const saved = safeParseJson<Truck[]>(localStorage.getItem(TRUCKS_KEY), [])
  return saved.length ? saved : getSeedTrucks()
}

function saveTrucks(trucks: Truck[]): void {
  safeSetItem(TRUCKS_KEY, trucks)
}

export function getTrucksByCompany(companyName: string): Truck[] {
  return getAllTrucks().filter((t) => t.companyName === companyName)
}

export function addTruck(data: Omit<Truck, 'id'>): Truck {
  const trucks = getAllTrucks()
  const created: Truck = { ...data, id: uid() }
  saveTrucks([created, ...trucks])
  return created
}

export function deleteTruck(truckId: string): void {
  const next = getAllTrucks().filter((t) => t.id !== truckId)
  saveTrucks(next)
}

export function getAllRatings(): Rating[] {
  return safeParseJson<Rating[]>(localStorage.getItem(RATINGS_KEY), [])
}

export function getRatingsByTruck(truckId: string): Rating[] {
  return getAllRatings()
    .filter((r) => r.truckId === truckId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function getTruckRatingAverage(truckId: string): number | null {
  const ratings = getRatingsByTruck(truckId)
  if (!ratings.length) return null
  const avg = ratings.reduce((sum, r) => sum + r.stars, 0) / ratings.length
  return Math.round(avg * 10) / 10
}

export function addRating(data: Omit<Rating, 'id' | 'createdAt'>): Rating {
  const rating: Rating = { id: uid(), createdAt: new Date().toISOString(), ...data }
  safeSetItem(RATINGS_KEY, [rating, ...getAllRatings()])
  return rating
}

// ── Admin demo entities ─────────────────────────────────────────────────────

export type UserRole = 'SHIPPER' | 'COMPANY' | 'ADMIN'

export type CompanyStatus = 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED'

export type ShipmentStatus =
  | 'POSTED'
  | 'AWAITING_ESCROW'
  | 'ESCROW_FUNDED'
  | 'IN_TRANSIT'
  | 'AWAITING_CONFIRMATION'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'DISPUTED'

export type PaymentStatus = 'PENDING' | 'CONFIRMED' | 'RELEASED' | 'REFUNDED'

export type RefundReason = 'DISPUTE_RESOLVED' | 'PAYMENT_FAILED'

export type AuditTargetType = 'company' | 'user' | 'shipment'

export interface Company {
  id: string
  userId: string
  name: string
  /** Email used by demo sign-in. */
  email?: string
  rdbNumber: string
  contactPerson: string
  baseDistrict: string
  status: CompanyStatus
  createdAt: string
}

export interface Shipment {
  id: string
  shipperName: string
  pickupDistrict: string
  dropoffDistrict: string
  cargoDescription?: string
  weightTons: number
  offeredPriceRwf: number
  pickupDate: string
  status: ShipmentStatus
  companyName?: string
  truckPlate?: string
  createdAt: string
}

export interface Payment {
  id: string
  shipmentId: string
  shipperName: string
  companyName?: string
  amountRwf: number
  status: PaymentStatus
  createdAt: string
}

export interface Refund {
  id: string
  shipmentId: string
  paymentId: string
  escrowAmountRwf: number
  platformAmountRwf: number
  shipperAmountRwf: number
  companyAmountRwf: number
  reason: RefundReason
  status: 'PENDING' | 'COMPLETED'
  createdAt: string
}

export interface Revenue {
  id: string
  shipmentId: string
  paymentId: string
  escrowAmountRwf: number
  amountEarnedRwf: number
  createdAt: string
}

export interface AuditLogEntry {
  id: string
  adminName: string
  action: string
  targetType: AuditTargetType
  targetId: string
  createdAt: string
}

const COMPANIES_KEY = 'll_companies'
const SHIPMENTS_KEY = 'll_shipments'
const PAYMENTS_KEY = 'll_payments'
const REFUNDS_KEY = 'll_refunds'
const REVENUES_KEY = 'll_revenues'
const AUDIT_KEY = 'll_audit_logs'

export function getAllCompanies(): Company[] {
  try {
    return safeParseJson<Company[]>(localStorage.getItem(COMPANIES_KEY), [])
  } catch {
    return []
  }
}

function saveCompanies(companies: Company[]): void {
  safeSetItem(COMPANIES_KEY, companies)
}

function getAllShipments(): Shipment[] {
  try {
    return safeParseJson<Shipment[]>(localStorage.getItem(SHIPMENTS_KEY), [])
  } catch {
    return []
  }
}

function saveShipments(shipments: Shipment[]): void {
  safeSetItem(SHIPMENTS_KEY, shipments)
}

function getAllPayments(): Payment[] {
  try {
    return safeParseJson<Payment[]>(localStorage.getItem(PAYMENTS_KEY), [])
  } catch {
    return []
  }
}

function savePayments(payments: Payment[]): void {
  safeSetItem(PAYMENTS_KEY, payments)
}

function getAllRefunds(): Refund[] {
  try {
    return safeParseJson<Refund[]>(localStorage.getItem(REFUNDS_KEY), [])
  } catch {
    return []
  }
}

function saveRefunds(refunds: Refund[]): void {
  safeSetItem(REFUNDS_KEY, refunds)
}

function getAllRevenues(): Revenue[] {
  try {
    return safeParseJson<Revenue[]>(localStorage.getItem(REVENUES_KEY), [])
  } catch {
    return []
  }
}

function saveRevenues(revenues: Revenue[]): void {
  safeSetItem(REVENUES_KEY, revenues)
}

function getAllAuditLogs(): AuditLogEntry[] {
  try {
    return safeParseJson<AuditLogEntry[]>(localStorage.getItem(AUDIT_KEY), [])
  } catch {
    return []
  }
}

function saveAuditLogs(entries: AuditLogEntry[]): void {
  safeSetItem(AUDIT_KEY, entries)
}

export function ensureSeedAdminData(): void {
  const companies = getAllCompanies()
  const shipments = getAllShipments()
  const audit = getAllAuditLogs()
  // Seed each bucket independently so partial localStorage doesn't produce empty pages.
  if (companies.length && shipments.length && audit.length) return

  const now = Date.now()

  const seedCompanies: Company[] = companies.length
    ? companies
    : [
    {
      id: uid(),
      userId: 'company-user-1',
      name: 'Kigali Freight Ltd',
      email: 'kigali.freight@example.com',
      rdbNumber: 'RDB-001234',
      contactPerson: 'Alice N.',
      baseDistrict: 'Gasabo',
      status: 'PENDING_VERIFICATION',
      createdAt: new Date(now - 6 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: uid(),
      userId: 'company-user-2',
      name: 'Rwanda Cargo Co',
      email: 'rwanda.cargo@example.com',
      rdbNumber: 'RDB-005678',
      contactPerson: 'Ben M.',
      baseDistrict: 'Kicukiro',
      status: 'PENDING_VERIFICATION',
      createdAt: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: uid(),
      userId: 'company-user-3',
      name: 'Northern Transport',
      email: 'northern.transport@example.com',
      rdbNumber: 'RDB-009991',
      contactPerson: 'Claudine P.',
      baseDistrict: 'Musanze',
      status: 'VERIFIED',
      createdAt: new Date(now - 25 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ]

  const seedShipments: Shipment[] = shipments.length
    ? shipments
    : [
    {
      id: 'SH-001',
      shipperName: 'ACME Manufacturing',
      pickupDistrict: 'Kigali',
      dropoffDistrict: 'Gisenyi',
      cargoDescription: 'General cargo, palletized.',
      weightTons: 5,
      offeredPriceRwf: 150_000,
      pickupDate: '2026-03-15',
      status: 'ESCROW_FUNDED',
      companyName: 'Kigali Freight Ltd',
      truckPlate: 'RAB 123 A',
      createdAt: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'SH-002',
      shipperName: 'Green Farms',
      pickupDistrict: 'Kigali',
      dropoffDistrict: 'Butare',
      cargoDescription: 'Construction materials.',
      weightTons: 12,
      offeredPriceRwf: 320_000,
      pickupDate: '2026-03-18',
      status: 'IN_TRANSIT',
      companyName: 'Rwanda Cargo Co',
      truckPlate: 'RAC 456 B',
      createdAt: new Date(now - 4 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'SH-003',
      shipperName: 'Tech Supplies',
      pickupDistrict: 'Musanze',
      dropoffDistrict: 'Kigali',
      cargoDescription: 'Electronics (fragile).',
      weightTons: 8,
      offeredPriceRwf: 240_000,
      pickupDate: '2026-03-20',
      status: 'AWAITING_CONFIRMATION',
      companyName: 'Northern Transport',
      truckPlate: 'RAD 789 C',
      createdAt: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'DIS-001',
      shipperName: 'ACME Manufacturing',
      pickupDistrict: 'Kigali',
      dropoffDistrict: 'Gisenyi',
      cargoDescription: 'Damaged cargo claim.',
      weightTons: 5,
      offeredPriceRwf: 150_000,
      pickupDate: '2026-03-12',
      status: 'DISPUTED',
      companyName: 'Kigali Freight Ltd',
      truckPlate: 'RAB 123 A',
      createdAt: new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ]

  const seedPayments: Payment[] = [
    {
      id: 'PAY-001',
      shipmentId: 'SH-001',
      shipperName: 'ACME Manufacturing',
      companyName: 'Kigali Freight Ltd',
      amountRwf: 150_000,
      status: 'CONFIRMED',
      createdAt: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'PAY-002',
      shipmentId: 'SH-002',
      shipperName: 'Green Farms',
      companyName: 'Rwanda Cargo Co',
      amountRwf: 320_000,
      status: 'CONFIRMED',
      createdAt: new Date(now - 4 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'PAY-003',
      shipmentId: 'DIS-001',
      shipperName: 'ACME Manufacturing',
      companyName: 'Kigali Freight Ltd',
      amountRwf: 150_000,
      status: 'CONFIRMED',
      createdAt: new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ]

  saveCompanies(seedCompanies)
  saveShipments(seedShipments)
  savePayments(seedPayments)
  saveRefunds([])
  saveRevenues([])
  if (!audit.length) {
    saveAuditLogs([
      {
        id: 'AUD-001',
        adminName: 'System',
        action: 'SEED_DATA',
        targetType: 'shipment',
        targetId: 'SYSTEM',
        createdAt: new Date(now - 72 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'AUD-002',
        adminName: 'Admin A',
        action: 'COMPANY_APPROVED',
        targetType: 'company',
        targetId: 'Northern Transport',
        createdAt: new Date(now - 48 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'AUD-003',
        adminName: 'Admin B',
        action: 'DISPUTE_RESOLVED',
        targetType: 'shipment',
        targetId: 'DIS-001',
        createdAt: new Date(now - 12 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'AUD-004',
        adminName: 'Admin A',
        action: 'COMPANY_REJECTED',
        targetType: 'company',
        targetId: 'Rwanda Cargo Co',
        createdAt: new Date(now - 3 * 60 * 60 * 1000).toISOString(),
      },
    ])
  }

  // Optional: seed a couple ratings linked to demo plates if the user creates matching trucks.
  // (No side effects unless trucks exist; actual rating display uses truckId.)
}

export function getPendingCompanies(): Company[] {
  ensureSeedAdminData()
  return getAllCompanies()
    .filter((c) => c.status === 'PENDING_VERIFICATION')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function registerCompanyDemo(data: {
  email: string
  name: string
  rdbNumber: string
  contactPerson: string
  baseDistrict: string
}): Company {
  ensureSeedAdminData()
  const companies = getAllCompanies()
  const email = data.email.trim().toLowerCase()

  const existingByEmail = companies.find((c) => String(c.email ?? '').toLowerCase() === email)
  if (existingByEmail) return existingByEmail

  const created: Company = {
    id: uid(),
    userId: `company-user-${uid()}`,
    name: data.name.trim(),
    email,
    rdbNumber: data.rdbNumber.trim(),
    contactPerson: data.contactPerson.trim(),
    baseDistrict: data.baseDistrict.trim(),
    status: 'PENDING_VERIFICATION',
    createdAt: new Date().toISOString(),
  }

  saveCompanies([created, ...companies])
  return created
}

export function getCompanyByEmailDemo(email: string): Company | null {
  ensureSeedAdminData()
  const e = email.trim().toLowerCase()
  return getAllCompanies().find((c) => String(c.email ?? '').toLowerCase() === e) ?? null
}

export function approveCompany(companyId: string, adminName = 'Admin'): void {
  ensureSeedAdminData()
  const companies = getAllCompanies()
  const idx = companies.findIndex((c) => c.id === companyId)
  if (idx === -1) return
  companies[idx] = { ...companies[idx], status: 'VERIFIED' }
  saveCompanies(companies)
  const audit = getAllAuditLogs()
  saveAuditLogs([
    {
      id: uid(),
      adminName,
      action: 'COMPANY_APPROVED',
      targetType: 'company',
      targetId: companyId,
      createdAt: new Date().toISOString(),
    },
    ...audit,
  ])
}

export function rejectCompany(companyId: string, reason?: string, adminName = 'Admin'): void {
  ensureSeedAdminData()
  const companies = getAllCompanies()
  const idx = companies.findIndex((c) => c.id === companyId)
  if (idx === -1) return
  companies[idx] = { ...companies[idx], status: 'REJECTED' }
  saveCompanies(companies)
  const audit = getAllAuditLogs()
  saveAuditLogs([
    {
      id: uid(),
      adminName,
      action: reason ? `COMPANY_REJECTED:${reason}` : 'COMPANY_REJECTED',
      targetType: 'company',
      targetId: companyId,
      createdAt: new Date().toISOString(),
    },
    ...audit,
  ])
}

export function getAdminShipments(status?: ShipmentStatus): Shipment[] {
  ensureSeedAdminData()
  const all = getAllShipments().slice()
  const filtered = status ? all.filter((s) => s.status === status) : all
  return filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function getAdminDisputes(): Shipment[] {
  return getAdminShipments('DISPUTED')
}

export function resolveDispute(
  disputeId: string,
  payload:
    | { type: 'COMPANY_FULL' }
    | { type: 'SHIPPER_FULL' }
    | { type: 'SPLIT'; companyAmount: number; shipperAmount: number },
  adminName = 'Admin',
): void {
  ensureSeedAdminData()
  const shipments = getAllShipments()
  const idx = shipments.findIndex((s) => s.id === disputeId)
  if (idx === -1) return
  const shipment = shipments[idx]
  if (shipment.status !== 'DISPUTED') return

  const payments = getAllPayments()
  const payment = payments.find((p) => p.shipmentId === disputeId)
  const paymentId = payment?.id ?? `PAY-${uid()}`
  const escrow = payment?.amountRwf ?? shipment.offeredPriceRwf

  let shipperAmount = 0
  let companyAmount = 0
  let platformAmount = 0

  if (payload.type === 'COMPANY_FULL') {
    companyAmount = escrow
  } else if (payload.type === 'SHIPPER_FULL') {
    shipperAmount = escrow
  } else {
    companyAmount = Math.max(0, Number(payload.companyAmount))
    shipperAmount = Math.max(0, Number(payload.shipperAmount))
    const remainder = escrow - companyAmount - shipperAmount
    platformAmount = Math.max(0, remainder)
  }

  // Simple policy: platform earns 5% only when company receives something on a split/release.
  const amountEarned = payload.type === 'SHIPPER_FULL' ? 0 : Math.round(escrow * 0.05)

  saveRefunds([
    {
      id: uid(),
      shipmentId: disputeId,
      paymentId,
      escrowAmountRwf: escrow,
      platformAmountRwf: platformAmount,
      shipperAmountRwf: shipperAmount,
      companyAmountRwf: companyAmount,
      reason: 'DISPUTE_RESOLVED',
      status: 'COMPLETED',
      createdAt: new Date().toISOString(),
    },
    ...getAllRefunds(),
  ])

  saveRevenues([
    {
      id: uid(),
      shipmentId: disputeId,
      paymentId,
      escrowAmountRwf: escrow,
      amountEarnedRwf: amountEarned,
      createdAt: new Date().toISOString(),
    },
    ...getAllRevenues(),
  ])

  shipments[idx] = { ...shipment, status: 'COMPLETED' }
  saveShipments(shipments)

  saveAuditLogs([
    {
      id: uid(),
      adminName,
      action: 'DISPUTE_RESOLVED',
      targetType: 'shipment',
      targetId: disputeId,
      createdAt: new Date().toISOString(),
    },
    ...getAllAuditLogs(),
  ])
}

export function getAuditLogs(): AuditLogEntry[] {
  ensureSeedAdminData()
  return getAllAuditLogs().slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function getAdminAnalytics(): {
  revenue: { month: string; revenue: number; shipments: number }[]
  statuses: { status: string; count: number }[]
} {
  ensureSeedAdminData()
  const shipments = getAllShipments()
  const revenues = getAllRevenues()

  // status counts
  const statusCounts = new Map<string, number>()
  shipments.forEach((s) => {
    statusCounts.set(s.status, (statusCounts.get(s.status) ?? 0) + 1)
  })

  const statuses = Array.from(statusCounts.entries()).map(([status, count]) => ({ status, count }))

  // last 6 months (demo): combine seeded revenues + a small baseline using shipments
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
  const revenueByMonth = months.map((m) => ({ month: m, revenue: 0, shipments: 0 }))

  const baseline = shipments.filter((s) => s.status !== 'CANCELLED').slice(0, 6)
  baseline.forEach((s, i) => {
    revenueByMonth[i % revenueByMonth.length].shipments += 1
    revenueByMonth[i % revenueByMonth.length].revenue += Math.round(s.offeredPriceRwf * 0.05)
  })

  revenues.forEach((r, i) => {
    revenueByMonth[i % revenueByMonth.length].revenue += r.amountEarnedRwf
  })

  return { revenue: revenueByMonth, statuses }
}

// ── Company active / completed shipment demo data ──────────────────────────

// Seeds three active shipments for the demo company so CompanyActiveShipments
// has data to visualise across all three statuses.

const COMPANY_SEED_KEY = 'll_company_active_seed_v2'

export interface CompanyActiveShipment {
  id: string
  pickup: string
  dropoff: string
  weightTons: number
  priceRwf: number
  status: 'AWAITING_ESCROW' | 'ESCROW_FUNDED' | 'IN_TRANSIT' | 'AWAITING_CONFIRMATION' | 'COMPLETED' | 'COMPLETED'
  completedAt?: string
  shipperName: string
  shipperPhone: string
  truckPlate: string
  createdAt: string
}

function getCompanyActiveShipments(): CompanyActiveShipment[] {
  try {
    return safeParseJson<CompanyActiveShipment[]>(localStorage.getItem(COMPANY_SEED_KEY), [])
  } catch {
    return []
  }
}

function saveCompanyActiveShipments(items: CompanyActiveShipment[]): void {
  safeSetItem(COMPANY_SEED_KEY, items)
}

export function ensureSeedCompanyData(): void {
  const existing = getCompanyActiveShipments()
  if (existing.length > 0) return

  const now = Date.now()
  const seed: CompanyActiveShipment[] = [
    {
      id: 'CA-000',
      pickup: 'Kigali',
      dropoff: 'Nyamata',
      weightTons: 6,
      priceRwf: 120_000,
      status: 'AWAITING_ESCROW',
      shipperName: 'Pearl Logistics',
      shipperPhone: '+250 788 000 111',
      truckPlate: 'RAE 321 D',
      createdAt: new Date(now - 0.5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'CA-001',
      pickup: 'Kigali',
      dropoff: 'Musanze',
      weightTons: 8,
      priceRwf: 180_000,
      status: 'ESCROW_FUNDED',
      shipperName: 'ACME Manufacturing',
      shipperPhone: '+250 788 111 222',
      truckPlate: 'RAB 123 A',
      createdAt: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'CA-002',
      pickup: 'Butare',
      dropoff: 'Kigali',
      weightTons: 15,
      priceRwf: 320_000,
      status: 'IN_TRANSIT',
      shipperName: 'Green Farms Ltd',
      shipperPhone: '+250 722 333 444',
      truckPlate: 'RAC 456 B',
      createdAt: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'CA-003',
      pickup: 'Gisenyi',
      dropoff: 'Kigali',
      weightTons: 5,
      priceRwf: 95_000,
      status: 'AWAITING_CONFIRMATION',
      shipperName: 'Tech Supplies Rwanda',
      shipperPhone: '+250 733 555 666',
      truckPlate: 'RAD 789 C',
      createdAt: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'CA-004',
      pickup: 'Kigali',
      dropoff: 'Rwamagana',
      weightTons: 10,
      priceRwf: 210_000,
      status: 'COMPLETED',
      shipperName: 'Rwanda Beverages Co',
      shipperPhone: '+250 788 777 888',
      truckPlate: 'RAB 123 A',
      createdAt: new Date(now - 8 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'CA-005',
      pickup: 'Musanze',
      dropoff: 'Huye',
      weightTons: 20,
      priceRwf: 450_000,
      status: 'COMPLETED',
      shipperName: 'East Africa Imports',
      shipperPhone: '+250 722 999 000',
      truckPlate: 'RAC 456 B',
      createdAt: new Date(now - 14 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ]
  saveCompanyActiveShipments(seed)
}

const COMPANY_COMPLETED_KEY = 'll_company_completed_seed'

export interface CompanyCompletedShipment {
  id: string
  pickup: string
  dropoff: string
  weightTons: number
  priceRwf: number
  platformFee: number
  payoutRwf: number
  shipperName: string
  truckPlate: string
  completedAt: string
}

function getCompanyCompletedStorage(): CompanyCompletedShipment[] {
  try {
    return safeParseJson<CompanyCompletedShipment[]>(localStorage.getItem(COMPANY_COMPLETED_KEY), [])
  } catch {
    return []
  }
}

function saveCompanyCompleted(items: CompanyCompletedShipment[]): void {
  safeSetItem(COMPANY_COMPLETED_KEY, items)
}

export function ensureSeedCompanyCompleted(): void {
  if (getCompanyCompletedStorage().length > 0) return
  const now = Date.now()
  const seed: CompanyCompletedShipment[] = [
    {
      id: 'CC-001',
      pickup: 'Kigali',
      dropoff: 'Rwamagana',
      weightTons: 10,
      priceRwf: 200_000,
      platformFee: 10_000,
      payoutRwf: 190_000,
      shipperName: 'Horizon Foods',
      truckPlate: 'RAB 123 A',
      completedAt: new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'CC-002',
      pickup: 'Musanze',
      dropoff: 'Butare',
      weightTons: 6,
      priceRwf: 140_000,
      platformFee: 7_000,
      payoutRwf: 133_000,
      shipperName: 'Rwanda Timber Co',
      truckPlate: 'RAC 456 B',
      completedAt: new Date(now - 14 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'CC-003',
      pickup: 'Gisenyi',
      dropoff: 'Kigali',
      weightTons: 12,
      priceRwf: 280_000,
      platformFee: 14_000,
      payoutRwf: 266_000,
      shipperName: 'ACME Manufacturing',
      truckPlate: 'RAD 789 C',
      completedAt: new Date(now - 21 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ]
  saveCompanyCompleted(seed)
}

export function getCompanyCompletedDemoShipments(): CompanyCompletedShipment[] {
  ensureSeedCompanyCompleted()
  return getCompanyCompletedStorage()
    .slice()
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
}

export function completeCompanyDemoShipment(id: string): void {
  // Move from active to completed
  const active = getCompanyActiveShipments()
  const idx = active.findIndex((s) => s.id === id)
  if (idx === -1) return
  const s = active[idx]
  const platformFee = Math.round(s.priceRwf * 0.05)
  const completed: CompanyCompletedShipment = {
    id: s.id,
    pickup: s.pickup,
    dropoff: s.dropoff,
    weightTons: s.weightTons,
    priceRwf: s.priceRwf,
    platformFee,
    payoutRwf: s.priceRwf - platformFee,
    shipperName: s.shipperName,
    truckPlate: s.truckPlate,
    completedAt: new Date().toISOString(),
  }
  // Remove from active
  active.splice(idx, 1)
  saveCompanyActiveShipments(active)
  // Add to completed
  ensureSeedCompanyCompleted()
  saveCompanyCompleted([completed, ...getCompanyCompletedStorage()])
}

export function getCompanyActiveDemoShipments(): CompanyActiveShipment[] {
  ensureSeedCompanyData()
  return getCompanyActiveShipments()
    .slice()
    .sort((a, b) => {
      const order = { AWAITING_ESCROW: 0, ESCROW_FUNDED: 1, IN_TRANSIT: 2, AWAITING_CONFIRMATION: 3, COMPLETED: 4 }
      return (order[a.status] ?? 9) - (order[b.status] ?? 9)
    })
}

export function updateCompanyDemoShipmentStatus(
  id: string,
  status: 'IN_TRANSIT' | 'AWAITING_CONFIRMATION',
): void {
  const items = getCompanyActiveShipments()
  const idx = items.findIndex((s) => s.id === id)
  if (idx === -1) return
  items[idx] = { ...items[idx], status }
  saveCompanyActiveShipments(items)
}

// ── Shipper demo seed ────────────────────────────────────────────────────────
// All shipper data lives here so the full flow works without a backend.

const SHIPPER_SEED_KEY = 'll_shipper_seed_v1'

export type ShipperShipmentStatus =
  | 'POSTED'
  | 'AWAITING_ESCROW'
  | 'ESCROW_FUNDED'
  | 'IN_TRANSIT'
  | 'AWAITING_CONFIRMATION'
  | 'COMPLETED'
  | 'DISPUTED'

export interface ShipperInterest {
  id: string
  companyName: string
  companyRating: number        // 1-5
  truckPlate: string
  truckType: string
  capacityTons: number
  baseDistrict: string
}

export interface ShipperShipment {
  id: string
  pickup: string
  dropoff: string
  cargoDescription: string
  weightTons: number
  priceRwf: number
  pickupDate: string
  status: ShipperShipmentStatus
  selectedCompanyName?: string
  selectedTruckPlate?: string
  interests: ShipperInterest[]
  rated: boolean
  createdAt: string
}

function getShipperShipments(): ShipperShipment[] {
  try { return safeParseJson<ShipperShipment[]>(localStorage.getItem(SHIPPER_SEED_KEY), []) }
  catch { return [] }
}

function saveShipperShipments(items: ShipperShipment[]): void {
  try { localStorage.setItem(SHIPPER_SEED_KEY, JSON.stringify(items)) } catch {}
}

export function ensureSeedShipperData(): void {
  if (getShipperShipments().length > 0) return
  const now = Date.now()
  const seed: ShipperShipment[] = [
    {
      id: 'SS-001',
      pickup: 'Kigali',
      dropoff: 'Musanze',
      cargoDescription: 'Construction materials — cement bags and iron sheets',
      weightTons: 8,
      priceRwf: 250_000,
      pickupDate: '2026-03-20',
      status: 'POSTED',
      interests: [
        { id: 'i1', companyName: 'Kigali Express Logistics', companyRating: 4.8, truckPlate: 'RAD 123 A', truckType: 'Flatbed', capacityTons: 10, baseDistrict: 'Kigali' },
        { id: 'i2', companyName: 'Fast Move Transport', companyRating: 4.9, truckPlate: 'RAF 789 C', truckType: 'Flatbed', capacityTons: 9, baseDistrict: 'Huye' },
        { id: 'i3', companyName: 'Rwanda Trans Co.', companyRating: 4.5, truckPlate: 'RAE 456 B', truckType: 'Box Truck', capacityTons: 12, baseDistrict: 'Musanze' },
      ],
      rated: false,
      createdAt: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'SS-002',
      pickup: 'Huye',
      dropoff: 'Kigali',
      cargoDescription: 'Electronic equipment and office furniture',
      weightTons: 5,
      priceRwf: 180_000,
      pickupDate: '2026-03-22',
      status: 'AWAITING_CONFIRMATION',
      selectedCompanyName: 'Kigali Express Logistics',
      selectedTruckPlate: 'RAD 123 A',
      interests: [],
      rated: false,
      createdAt: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'SS-003',
      pickup: 'Musanze',
      dropoff: 'Gisenyi',
      cargoDescription: 'Agricultural produce — fresh vegetables',
      weightTons: 3,
      priceRwf: 90_000,
      pickupDate: '2026-03-10',
      status: 'COMPLETED',
      selectedCompanyName: 'Fast Move Transport',
      selectedTruckPlate: 'RAF 789 C',
      interests: [],
      rated: false,
      createdAt: new Date(now - 15 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ]
  saveShipperShipments(seed)
}

export function getShipperDemoShipments(): ShipperShipment[] {
  ensureSeedShipperData()
  return getShipperShipments()
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function addShipperDemoShipment(data: Omit<ShipperShipment, 'id' | 'createdAt' | 'interests' | 'rated' | 'status'>): ShipperShipment {
  ensureSeedShipperData()
  const items = getShipperShipments()
  const newItem: ShipperShipment = {
    ...data,
    id: 'SS-' + Date.now(),
    status: 'POSTED',
    interests: [],
    rated: false,
    createdAt: new Date().toISOString(),
  }
  saveShipperShipments([newItem, ...items])
  return newItem
}

export function selectShipperTruck(shipmentId: string, interest: ShipperInterest): void {
  const items = getShipperShipments()
  const idx = items.findIndex((s) => s.id === shipmentId)
  if (idx === -1) return
  items[idx] = {
    ...items[idx],
    status: 'AWAITING_ESCROW',
    selectedCompanyName: interest.companyName,
    selectedTruckPlate: interest.truckPlate,
  }
  saveShipperShipments(items)
}

export function payShipperEscrow(shipmentId: string): void {
  const items = getShipperShipments()
  const idx = items.findIndex((s) => s.id === shipmentId)
  if (idx === -1) return
  items[idx] = { ...items[idx], status: 'ESCROW_FUNDED' }
  saveShipperShipments(items)
}

export function confirmShipperDelivery(shipmentId: string): void {
  const items = getShipperShipments()
  const idx = items.findIndex((s) => s.id === shipmentId)
  if (idx === -1) return
  items[idx] = { ...items[idx], status: 'COMPLETED' }
  saveShipperShipments(items)
}

export function disputeShipperDelivery(shipmentId: string): void {
  const items = getShipperShipments()
  const idx = items.findIndex((s) => s.id === shipmentId)
  if (idx === -1) return
  items[idx] = { ...items[idx], status: 'DISPUTED' }
  saveShipperShipments(items)
}

export function markShipperRated(shipmentId: string): void {
  const items = getShipperShipments()
  const idx = items.findIndex((s) => s.id === shipmentId)
  if (idx === -1) return
  items[idx] = { ...items[idx], rated: true }
  saveShipperShipments(items)
}



// ── Pending trucks queue (for admin approval flow) ──────────────────────────

const PENDING_TRUCKS_KEY = 'll_pending_trucks'

export interface PendingTruck {
  id: string
  plateNumber: string
  truckType: string
  capacity: string
  companyName: string
  companyEmail: string
  insuranceCertName?: string
  createdAt: string
}

export function getPendingTrucksDemo(): PendingTruck[] {
  return safeParseJson<PendingTruck[]>(localStorage.getItem(PENDING_TRUCKS_KEY), [])
}

export function addPendingTruck(data: Omit<PendingTruck, 'id' | 'createdAt'>): PendingTruck {
  const existing = getPendingTrucksDemo()
  const truck: PendingTruck = { ...data, id: uid(), createdAt: new Date().toISOString() }
  safeSetItem(PENDING_TRUCKS_KEY, [truck, ...existing])
  return truck
}

export function approvePendingTruck(pendingId: string): void {
  const pending = getPendingTrucksDemo()
  const truck = pending.find(t => t.id === pendingId)
  if (!truck) return
  // Move to active trucks
  addTruck({
    companyName: truck.companyName,
    capacity: truck.capacity,
    plateNumber: truck.plateNumber,
    type: truck.truckType,
  })
  // Remove from pending
  safeSetItem(PENDING_TRUCKS_KEY, pending.filter(t => t.id !== pendingId))
}

export function rejectPendingTruck(pendingId: string): void {
  const pending = getPendingTrucksDemo()
  safeSetItem(PENDING_TRUCKS_KEY, pending.filter(t => t.id !== pendingId))
}

// ── Bridge: real loads → admin shipment monitoring ───────────────────────────

/**
 * Returns all loads from ll_loads (shipper world) merged into the Shipment shape
 * so admin can see ALL real shipments, not just seeded ones.
 */
export function getAllRealShipmentsForAdmin(): Shipment[] {
  const loads = getAllLoads()
  const stages = getStageMap()
  return loads.map((l): Shipment => {
    const stage = stages[l.id] ?? 'POSTED'
    const statusMap: Record<string, ShipmentStatus> = {
      POSTED:                'POSTED',
      AWAITING_ESCROW:       'AWAITING_ESCROW',
      IN_TRANSIT:            'IN_TRANSIT',
      AWAITING_CONFIRMATION: 'AWAITING_CONFIRMATION',
      COMPLETED:             'COMPLETED',
      DISPUTED:              'DISPUTED',
      CANCELLED:             'CANCELLED',
    }
    return {
      id: l.id,
      shipperName: l.createdBy,
      pickupDistrict: l.origin,
      dropoffDistrict: l.destination,
      cargoDescription: l.description ?? '',
      weightTons: parseFloat(l.weight) || 0,
      offeredPriceRwf: parseInt((l.price ?? '0').replace(/[^0-9]/g, '')) || 0,
      pickupDate: l.date,
      status: statusMap[stage] ?? 'POSTED',
      companyName: l.offers?.[0]?.companyName ?? undefined,
      truckPlate: undefined,
      createdAt: new Date().toISOString(),
    }
  })
}

// ── Interest dedup tracking for demo mode ────────────────────────────────────

const INTERESTS_KEY = 'll_company_interests'

type InterestRecord = { companyName: string; loadId: string }

export function getMyInterestsDemo(companyName: string): string[] {
  const all = safeParseJson<InterestRecord[]>(localStorage.getItem(INTERESTS_KEY), [])
  return all.filter(r => r.companyName === companyName).map(r => r.loadId)
}

export function recordInterestDemo(companyName: string, loadId: string): void {
  const all = safeParseJson<InterestRecord[]>(localStorage.getItem(INTERESTS_KEY), [])
  if (!all.some(r => r.companyName === companyName && r.loadId === loadId)) {
    safeSetItem(INTERESTS_KEY, [...all, { companyName, loadId }])
  }
}

// ── Live audit log writer ─────────────────────────────────────────────────────

export function writeAuditLog(adminName: string, action: string, targetType: AuditTargetType, targetId: string): void {
  const existing = safeParseJson<AuditLogEntry[]>(localStorage.getItem(AUDIT_KEY), [])
  const entry: AuditLogEntry = {
    id: uid(),
    adminName,
    action,
    targetType,
    targetId,
    createdAt: new Date().toISOString(),
  }
  safeSetItem(AUDIT_KEY, [entry, ...existing])
}
