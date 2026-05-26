import type { PaginatedResponse } from '@/types/pagination'

export interface AdminUserListItem {
  id: number
  email: string
  status: 'ACTIVE' | 'INACTIVE' | 'BANNED' | 'DELETED'
  profile: { companyName: string }
  subscription: { plan: { level: string } } | null
  createdAt: string
}

export type AdminUsersResponse = PaginatedResponse<AdminUserListItem>

export interface AdminUserQueryParams {
  plan?: string
  status?: string
  search?: string
  page?: number
  limit?: number
}
