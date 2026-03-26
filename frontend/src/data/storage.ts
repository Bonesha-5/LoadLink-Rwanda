/** Local demo storage (localStorage). Avoid side-effects at import time. */

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
  // Price set by the shipper (e.g. "150,000 RWF")
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

// ── Ratings (demo) ─────────────────────────────────────────────────────────

export interface Rating {
  id: string
  truckId: string
  shipmentId?: string
  shipperName: string
  stars: 1 | 2 | 3 | 4 | 5
  comment?: string
  createdAt: string
}

const RATINGS_KEY = 'll_ratings'

function getAllRatings(): Rating[] {
  try {
    return safeParseJson<Rating[]>(localStorage.getItem(RATINGS_KEY), [])
  } catch {
    return []
  }
}

function saveRatings(ratings: Rating[]): void {
  safeSetItem(RATINGS_KEY, ratings)
}

export function addRating(data: Omit<Rating, 'id' | 'createdAt'>): Rating {
  const rating: Rating = { id: uid(), createdAt: new Date().toISOString(), ...data }
  saveRatings([rating, ...getAllRatings()])
  return rating
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

function getAllCompanies(): Company[] {
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
