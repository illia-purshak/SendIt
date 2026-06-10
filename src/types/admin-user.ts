import type { PaginatedResponse } from '@/types/pagination'
import type { UserSubscriptionBalance } from '@/types/subscription'

export interface AdminUserProfile {
  companyName: string | null
  firstName: string | null
  lastName: string | null
  edrpou: string | null
  taxNumber: string | null
  legalAddress: string | null
  contactPerson: string | null
  phone: string | null
}

export interface AdminUserPostalConnection {
  id: number
  userId: number
  postalServiceId: number
  status: 'ACTIVE' | 'BLOCKED' | 'INVALID'
  connectedAt: string
  updatedAt: string
  postalService: { id: number; name: string; slug: string; logoUrl: string | null }
}

export interface AdminUserDetail {
  id: number
  email: string | null
  phoneNumber: string | null
  role: string
  status: 'ACTIVE' | 'INACTIVE' | 'BANNED' | 'DELETED'
  profileCompleted: boolean
  avatarUrl: string | null
  language: string
  timezone: string
  dateFormat: string
  scheduledDeletionAt: string | null
  createdAt: string
  updatedAt: string
  profile: AdminUserProfile | null
  subscriptionBalances: UserSubscriptionBalance[]
  postalConnections: AdminUserPostalConnection[]
  _count: { supportTickets: number }
}

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
