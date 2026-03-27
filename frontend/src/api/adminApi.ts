import { apiRequest } from './http'

export type AdminLoginResponse = {
  token: string
  user: {
    id?: string
    name?: string
    email?: string
    role?: string
  }
}

export async function adminLogin(email: string, password: string): Promise<AdminLoginResponse> {
  return apiRequest<AdminLoginResponse>('/api/admin/login', {
    method: 'POST',
    body: { email, password },
  })
}

export type PendingCompanyDto = {
  id: string
  name: string
  rdb_number?: string
  rdbNumber?: string
  contact_person?: string
  contactPerson?: string
  base_district?: string
  baseDistrict?: string
  created_at?: string
  createdAt?: string
  email?: string
}

export async function getPendingCompaniesApi(token: string): Promise<PendingCompanyDto[]> {
  return apiRequest<PendingCompanyDto[]>('/api/admin/companies/pending', { token })
}

export async function getCompanyDocsApi(
  token: string,
  companyId: string,
): Promise<{
  name?: string
  business_cert_path?: string
  insurance_doc_path?: string
  businessCertPath?: string
  insuranceDocPath?: string
}> {
  return apiRequest(`/api/admin/companies/${encodeURIComponent(companyId)}/docs`, { token })
}

export async function approveCompanyApi(token: string, companyId: string): Promise<{ message?: string }> {
  return apiRequest(`/api/admin/companies/${encodeURIComponent(companyId)}/approve`, { method: 'PATCH', token })
}

export async function rejectCompanyApi(
  token: string,
  companyId: string,
  reason: string,
): Promise<{ message?: string; reason?: string }> {
  return apiRequest(`/api/admin/companies/${encodeURIComponent(companyId)}/reject`, {
    method: 'PATCH',
    token,
    body: { reason },
  })
}

