import { apiRequest } from './http'

export type CompanyLoginResponse = {
  success: boolean
  token: string
  user: {
    id?: number
    email?: string
    role?: string
    company_id?: number
    company_name?: string
    contact_person?: string
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
  business_cert_path: string
  insurance_doc_path: string
}): Promise<{ success: boolean; message?: string }> {
  return apiRequest('/api/company/register', { method: 'POST', body: payload })
}
