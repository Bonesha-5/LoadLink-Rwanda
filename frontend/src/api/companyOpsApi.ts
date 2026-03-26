import { apiRequest } from './http'

export type ShipmentStatus =
  | 'POSTED'
  | 'AWAITING_ESCROW'
  | 'ESCROW_FUNDED'
  | 'IN_TRANSIT'
  | 'AWAITING_CONFIRMATION'
  | 'COMPLETED'
  | 'DISPUTED'
  | 'CANCELLED'

export type CompanyShipment = {
  id: string
  pickup_district?: string
  dropoff_district?: string
  pickupDistrict?: string
  dropoffDistrict?: string
  weight_tons?: number
  weightTons?: number
  offered_price_rwf?: number
  offeredPriceRwf?: number
  status: ShipmentStatus
  created_at?: string
  createdAt?: string
  shipper_name?: string
  shipperName?: string
  shipper_phone?: string
  shipperPhone?: string
  shipper_email?: string
  shipperEmail?: string
  truck_plate?: string
  truckPlate?: string
  company_name?: string
  companyName?: string
}

export type CompanyTruck = {
  id: string
  plate_number?: string
  plateNumber?: string
  truck_type?: string
  truckType?: string
  declared_capacity?: number
  declaredCapacity?: number
  availability_status?: 'AVAILABLE' | 'RESERVED' | 'IN_TRANSIT' | 'UNAVAILABLE'
  availabilityStatus?: 'AVAILABLE' | 'RESERVED' | 'IN_TRANSIT' | 'UNAVAILABLE'
}

export async function getAvailableShipments(token: string): Promise<CompanyShipment[]> {
  return apiRequest<CompanyShipment[]>('/api/shipments/', { token })
}

export async function getActiveShipments(token: string): Promise<CompanyShipment[]> {
  return apiRequest<CompanyShipment[]>('/api/shipments/active', { token })
}

export async function pickupShipment(token: string, shipmentId: string, truckId: string): Promise<{ message?: string }> {
  return apiRequest(`/api/shipments/${encodeURIComponent(shipmentId)}/pickup`, {
    method: 'PATCH',
    token,
    body: { truckId },
  })
}

export async function deliverShipment(token: string, shipmentId: string, truckId: string): Promise<{ message?: string }> {
  return apiRequest(`/api/shipments/${encodeURIComponent(shipmentId)}/deliver`, {
    method: 'PATCH',
    token,
    body: { truckId },
  })
}

export async function registerTruck(
  token: string,
  payload: { plate_number: string; truck_type: string; declared_capacity: number; reg_card_path: string },
): Promise<{ message?: string; truck?: unknown }> {
  return apiRequest('/api/trucks/register', { method: 'POST', token, body: payload })
}

export async function getMyTrucks(token: string): Promise<CompanyTruck[]> {
  return apiRequest<CompanyTruck[]>('/api/trucks/my', { token })
}

export async function updateTruckStatus(
  token: string,
  truckId: string,
  availability_status: 'AVAILABLE' | 'RESERVED' | 'IN_TRANSIT' | 'UNAVAILABLE',
): Promise<{ message?: string }> {
  return apiRequest(`/api/trucks/${encodeURIComponent(truckId)}/status`, {
    method: 'PATCH',
    token,
    body: { availability_status },
  })
}

export async function expressInterest(
  token: string,
  payload: { shipment_id: string; truck_id: string },
): Promise<{ message?: string; interest?: unknown }> {
  return apiRequest('/api/interests', { method: 'POST', token, body: payload })
}

export async function getMyInterests(token: string): Promise<unknown> {
  return apiRequest('/api/interests/my', { token })
}

export type CompanyInterest = {
  id?: string
  shipment_id?: string
  shipmentId?: string
  truck_id?: string
  truckId?: string
  created_at?: string
  createdAt?: string
}

export async function getMyInterestsList(token: string): Promise<CompanyInterest[]> {
  const res = await apiRequest<unknown>('/api/interests/my', { token })
  if (Array.isArray(res)) return res as CompanyInterest[]
  if (res && typeof res === 'object' && 'data' in (res as any) && Array.isArray((res as any).data)) {
    return (res as any).data as CompanyInterest[]
  }
  return []
}

