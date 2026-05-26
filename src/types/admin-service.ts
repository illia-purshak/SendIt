import type { PaginatedResponse } from '@/types/pagination'

export interface AdminService {
  id: number
  name: string
  slug: string
  logoUrl: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type AdminServicesResponse = PaginatedResponse<AdminService>

export interface AdminServiceCreateBody {
  name: string
  slug: string
  logoUrl?: string | null
}

export interface AdminServiceUpdateBody {
  name?: string
  logoUrl?: string | null
  isActive?: boolean
}
