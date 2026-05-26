import type { PaginatedResponse } from '@/types/pagination'

export type SupportTicketStatus = 'WAITING' | 'IN_PROGRESS' | 'CLOSED' | 'OPEN'
export type SupportTicketCategory =
  | 'QUESTION'
  | 'TECHNICAL'
  | 'BILLING'
  | 'SUGGESTION'
  | 'OTHER'
export type SupportTicketTab = 'active' | 'closed' | 'all'
export type SupportMessageKind = 'CLIENT' | 'ADMIN' | 'SYSTEM'

export interface SupportMessageAdmin {
  id?: number
  firstName?: string | null
  lastName?: string | null
  email?: string | null
  avatarUrl?: string | null
}

export interface SupportTicketUser {
  id: number
  email: string
  profile: { companyName: string | null }
}

export interface SupportAssignedAdmin {
  id: number
  firstName: string | null
  lastName: string | null
  email?: string | null
  avatarUrl?: string | null
}

export interface SupportMessage {
  id: number
  body: string
  createdAt: string
  userId: number | null
  adminId: number | null
  isAdmin: boolean
  admin: SupportMessageAdmin | null
  user?: { id?: number; email?: string | null } | null
  kind?: SupportMessageKind
  isSystem?: boolean
}

export interface SupportTicketListMessage {
  id: number
  body: string
  createdAt: string
  isFromAdmin?: boolean
}

interface SupportTicketBase {
  id: number
  userId: number
  subject: string
  status: SupportTicketStatus
  user: SupportTicketUser
  createdAt: string
  updatedAt: string
  category?: SupportTicketCategory
  unreadCount?: number
  hasUnread?: boolean
  lastMessagePreview?: string | null
  lastMessageAt?: string | null
  assignedAdmin?: SupportAssignedAdmin | null
}

export interface SupportTicketListItem extends SupportTicketBase {
  messages?: SupportTicketListMessage[]
}

export interface SupportTicketDetail extends SupportTicketBase {
  messages: SupportMessage[]
}

export interface SupportTicketsResponse extends PaginatedResponse<SupportTicketListItem> {
  openCount?: number
}

export interface AdminSupportQueryParams {
  status?: Exclude<SupportTicketStatus, 'OPEN'> | 'all'
  category?: SupportTicketCategory
  search?: string
  page?: number
  limit?: number
  assigned?: 'me' | 'all'
}

export interface ClientSupportQueryParams {
  status?: Exclude<SupportTicketStatus, 'OPEN'> | 'all'
  page?: number
  limit?: number
}
