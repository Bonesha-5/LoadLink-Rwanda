import { apiRequest } from './http'

export type ShipperAuthResponse = {
  success: boolean
  token: string
  user: {
    id: string
    name: string
    email: string
    role: string
  }
}

export async function shipperLogin(email: string, password: string): Promise<ShipperAuthResponse> {
  return apiRequest<ShipperAuthResponse>('/api/shippers/login', {
    method: 'POST',
    body: { email, password },
  })
}

export async function shipperRegister(payload: {
  name: string
  phone: string
  email: string
  password: string
}): Promise<ShipperAuthResponse> {
  return apiRequest<ShipperAuthResponse>('/api/shippers/register', {
    method: 'POST',
    body: payload,
  })
}
