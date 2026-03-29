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

export type AdminShipmentDto = {
  id: string
  pickup_district?: string
  pickupDistrict?: string
  dropoff_district?: string
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
  shipper_email?: string
  shipperEmail?: string
  shipper_phone?: string
  shipperPhone?: string
  truck_plate?: string
  truckPlate?: string
  company_name?: string
  companyName?: string
  escrow_amount?: number
  escrowAmount?: number
  payment_status?: string
  paymentStatus?: string
}

export async function getAdminShipmentsApi(token: string, status?: ShipmentStatus): Promise<AdminShipmentDto[]> {
  const q = status ? `?status=${encodeURIComponent(status)}` : ''
  return apiRequest<AdminShipmentDto[]>(`/api/admin/shipments${q}`, { token })
}

export async function getAdminDisputesApi(token: string): Promise<AdminShipmentDto[]> {
  return apiRequest<AdminShipmentDto[]>('/api/admin/disputes', { token })
}

export async function resolveDisputeApi(
  token: string,
  shipmentId: string,
  resolution_type: 'FULL_RELEASE' | 'FULL_REFUND' | 'SPLIT',
  shipper_amount?: number,
  company_amount?: number,
): Promise<{ message?: string }> {
  return apiRequest('/api/payments/disputes/resolve', {
    method: 'POST',
    token,
    body: { shipment_id: shipmentId, resolution_type, shipper_amount, company_amount },
  })
}

export type AuditEntryDto = {
  id: string
  action: string
  target_type?: string
  targetType?: string
  target_id?: string
  targetId?: string
  created_at?: string
  createdAt?: string
  admin_name?: string
  adminName?: string
  admin_email?: string
  adminEmail?: string
}

export async function getAdminAuditApi(token: string): Promise<AuditEntryDto[]> {
  return apiRequest<AuditEntryDto[]>('/api/admin/audit', { token })
}
