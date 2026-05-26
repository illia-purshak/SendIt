import type { PaginatedResponse } from '@/types/pagination'

export type AdminMemberStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'DELETED'

export interface AdminMember {
  id: number
  email: string
  isSuperAdmin: boolean
  status: AdminMemberStatus
  invitedBy: { email: string } | null
  createdAt: string
}

export type AdminMembersResponse = PaginatedResponse<AdminMember>

export interface AdminInviteBody {
  email: string
}

export interface AdminInviteResponse {
  adminId: number
  email: string
  inviteUrl: string
  expiresAt: string
}

export interface AdminResendInviteResponse {
  inviteUrl: string
  expiresAt: string
}
