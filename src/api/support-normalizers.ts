import type {
  SupportAssignedAdmin,
  SupportMessage,
  SupportTicketCategory,
  SupportTicketDetail,
  SupportTicketListItem,
  SupportTicketsResponse,
  SupportTicketUser,
  SupportTicketStatus,
} from '@/types/support'

type RawListMessage = {
  id?: number
  body?: string | null
  createdAt?: string | null
  isFromAdmin?: boolean
} | null

type RawUser = {
  id?: number
  email?: string | null
  profile?: { companyName?: string | null } | null
} | null

type RawAdmin = {
  id?: number
  firstName?: string | null
  lastName?: string | null
  email?: string | null
  avatarUrl?: string | null
} | null

type RawListTicket = {
  id?: number
  subject?: string | null
  category?: SupportTicketCategory | null
  status?: SupportTicketStatus | null
  assignedTo?: RawAdmin
  createdAt?: string | null
  updatedAt?: string | null
  lastMessage?: RawListMessage
  hasUnread?: boolean
  unreadCount?: number
  user?: RawUser
  userId?: number
} | null

type RawDetailMessage = {
  id?: number
  body?: string | null
  isSystem?: boolean
  createdAt?: string | null
  user?: { id?: number; email?: string | null } | null
  admin?: RawAdmin
} | null

type RawDetailTicket = {
  id?: number
  subject?: string | null
  category?: SupportTicketCategory | null
  status?: SupportTicketStatus | null
  assignedTo?: RawAdmin
  createdAt?: string | null
  updatedAt?: string | null
  messages?: RawDetailMessage[] | null
  unreadCount?: number
  user?: RawUser
  userId?: number
} | null

type RawSupportListResponse = {
  items?: RawListTicket[] | null
  data?: RawListTicket[] | null
  meta?: {
    page?: number
    pageSize?: number
    totalItems?: number
    totalPages?: number
    hasNextPage?: boolean
    hasPreviousPage?: boolean
  } | null
  total?: number
  page?: number
  limit?: number
  totalPages?: number
  openCount?: number
} | null

function normalizeStatus(status?: SupportTicketStatus | null): SupportTicketStatus {
  return status === 'OPEN' ? 'WAITING' : (status ?? 'WAITING')
}

function normalizeUser(user?: RawUser, fallbackUserId?: number): SupportTicketUser {
  return {
    id: user?.id ?? fallbackUserId ?? 0,
    email: user?.email ?? '',
    profile: {
      companyName: user?.profile?.companyName ?? null,
    },
  }
}

function normalizeAssignedAdmin(admin?: RawAdmin): SupportAssignedAdmin | null {
  if (!admin?.id) return null
  return {
    id: admin.id,
    firstName: admin.firstName ?? null,
    lastName: admin.lastName ?? null,
    email: admin.email ?? null,
    avatarUrl: admin.avatarUrl ?? null,
  }
}

function normalizeListTicket(ticket: RawListTicket): SupportTicketListItem {
  const lastMessage = ticket?.lastMessage

  return {
    id: ticket?.id ?? 0,
    userId: ticket?.userId ?? ticket?.user?.id ?? 0,
    subject: ticket?.subject ?? '',
    status: normalizeStatus(ticket?.status),
    user: normalizeUser(ticket?.user, ticket?.userId),
    createdAt: ticket?.createdAt ?? '',
    updatedAt: ticket?.updatedAt ?? '',
    category: ticket?.category ?? 'OTHER',
    unreadCount: typeof ticket?.unreadCount === 'number' ? ticket.unreadCount : undefined,
    hasUnread: ticket?.hasUnread ?? false,
    lastMessagePreview: lastMessage?.body ?? null,
    lastMessageAt: lastMessage?.createdAt ?? null,
    assignedAdmin: normalizeAssignedAdmin(ticket?.assignedTo),
    messages: lastMessage
      ? [
          {
            id: lastMessage.id ?? 0,
            body: lastMessage.body ?? '',
            createdAt: lastMessage.createdAt ?? '',
            isFromAdmin: lastMessage.isFromAdmin,
          },
        ]
      : [],
  }
}

function normalizeDetailMessage(message: RawDetailMessage): SupportMessage {
  const isSystem = message?.isSystem === true
  const admin = message?.admin
  const user = message?.user

  return {
    id: message?.id ?? 0,
    body: message?.body ?? '',
    createdAt: message?.createdAt ?? '',
    userId: isSystem ? null : (user?.id ?? null),
    adminId: isSystem ? null : (admin?.id ?? null),
    isAdmin: !isSystem && Boolean(admin?.id),
    admin: admin
      ? {
          id: admin.id,
          firstName: admin.firstName ?? null,
          lastName: admin.lastName ?? null,
          email: admin.email ?? null,
          avatarUrl: admin.avatarUrl ?? null,
        }
      : null,
    user: user
      ? {
          id: user.id,
          email: user.email ?? null,
        }
      : null,
    kind: isSystem ? 'SYSTEM' : admin?.id ? 'ADMIN' : 'CLIENT',
    isSystem,
  }
}

export function normalizeSupportListResponse(raw: RawSupportListResponse): SupportTicketsResponse {
  const items = (raw?.items ?? raw?.data ?? []).map(normalizeListTicket)
  const page = raw?.meta?.page ?? raw?.page ?? 1
  const pageSize = raw?.meta?.pageSize ?? raw?.limit ?? 25
  const totalItems = raw?.meta?.totalItems ?? raw?.total ?? items.length
  const totalPages = raw?.meta?.totalPages ?? raw?.totalPages ?? 1

  return {
    items,
    openCount: raw?.openCount,
    meta: {
      page,
      pageSize,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  }
}

export function normalizeSupportTicketDetail(raw: RawDetailTicket): SupportTicketDetail {
  return {
    id: raw?.id ?? 0,
    userId: raw?.userId ?? raw?.user?.id ?? 0,
    subject: raw?.subject ?? '',
    status: normalizeStatus(raw?.status),
    user: normalizeUser(raw?.user, raw?.userId),
    createdAt: raw?.createdAt ?? '',
    updatedAt: raw?.updatedAt ?? '',
    category: raw?.category ?? 'OTHER',
    unreadCount: raw?.unreadCount ?? 0,
    hasUnread: (raw?.unreadCount ?? 0) > 0,
    lastMessagePreview: null,
    lastMessageAt: null,
    assignedAdmin: normalizeAssignedAdmin(raw?.assignedTo),
    messages: (raw?.messages ?? []).map(normalizeDetailMessage),
  }
}
