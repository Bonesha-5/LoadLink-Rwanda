import { apiRequest } from './http'

export type CompanyLoginResponse = {
  token: string
  user: {
    id?: string
    name?: string
    email?: string
    role?: string
    status?: string
  }
}

export async function companyLogin(email: string, password: string): Promise<CompanyLoginResponse> {
  return apiRequest<CompanyLoginResponse>('/api/company/login', {
    method: 'POST',
    body: { email, password },
  })
}

export async function companyRegister(payload: {
  email: string
  password: string
  name: string
  rdb_number: string
  contact_person: string
  phone: string
  base_district: string
  /** URL or storage path for business certificate (matches backend field name). */
  business_cert_url: string
  /** URL or storage path for insurance document (matches backend field name). */
  insurance_doc_url: string
}): Promise<{ message?: string; token?: string; user?: unknown }> {
  return apiRequest('/api/company/register', { method: 'POST', body: payload })
}

