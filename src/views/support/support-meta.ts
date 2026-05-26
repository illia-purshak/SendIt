import type {
  SupportAssignedAdmin,
  SupportMessage,
  SupportTicketCategory,
  SupportTicketDetail,
  SupportTicketListItem,
  SupportTicketStatus,
} from '@/types/support'

export const SUPPORT_STATUS_LABEL: Record<SupportTicketStatus, string> = {
  WAITING: 'Waiting',
  IN_PROGRESS: 'In Progress',
  CLOSED: 'Closed',
  OPEN: 'Waiting',
}

export const SUPPORT_STATUS_CLASS: Record<SupportTicketStatus, string> = {
  WAITING: 'bg-amber-100 text-amber-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  CLOSED: 'bg-neutral-100 text-neutral-500',
  OPEN: 'bg-amber-100 text-amber-800',
}

export const SUPPORT_CATEGORY_LABEL: Record<SupportTicketCategory, string> = {
  QUESTION: 'Question',
  TECHNICAL: 'Technical',
  BILLING: 'Billing',
  SUGGESTION: 'Suggestion',
  OTHER: 'Other',
}

export const SUPPORT_CATEGORY_CLASS: Record<SupportTicketCategory, string> = {
  QUESTION: 'bg-neutral-100 text-neutral-700',
  TECHNICAL: 'bg-blue-50 text-blue-700',
  BILLING: 'bg-emerald-50 text-emerald-700',
  SUGGESTION: 'bg-violet-50 text-violet-700',
  OTHER: 'bg-stone-100 text-stone-700',
}

export function isSupportTicketClosed(status: SupportTicketStatus) {
  return status === 'CLOSED'
}

export function isSupportTicketActive(status: SupportTicketStatus) {
  return status === 'WAITING' || status === 'IN_PROGRESS' || status === 'OPEN'
}

export function normalizeSupportStatus(status: SupportTicketStatus): SupportTicketStatus {
  return status === 'OPEN' ? 'WAITING' : status
}

export function getSupportCategoryLabel(category?: SupportTicketCategory | null) {
  if (!category) return 'Other'
  return SUPPORT_CATEGORY_LABEL[category] ?? category
}

export function getSupportCategoryClass(category?: SupportTicketCategory | null) {
  if (!category) return SUPPORT_CATEGORY_CLASS.OTHER
  return SUPPORT_CATEGORY_CLASS[category] ?? SUPPORT_CATEGORY_CLASS.OTHER
}

export function getSupportStatusLabel(status: SupportTicketStatus) {
  return SUPPORT_STATUS_LABEL[status] ?? status
}

export function getSupportStatusClass(status: SupportTicketStatus) {
  return SUPPORT_STATUS_CLASS[status] ?? SUPPORT_STATUS_CLASS.CLOSED
}

export function formatRelativeTime(dateString?: string | null) {
  if (!dateString) return ''
  const date = new Date(dateString)
  const diffSeconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000))

  if (diffSeconds < 60) return 'Just now'
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`
  if (diffSeconds < 604800) return `${Math.floor(diffSeconds / 86400)}d ago`
  return date.toLocaleDateString()
}

export function formatSupportTimestamp(dateString?: string | null) {
  if (!dateString) return ''
  return new Date(dateString).toLocaleString()
}

export function getTicketPreview(ticket: SupportTicketListItem | SupportTicketDetail) {
  if (ticket.lastMessagePreview) return ticket.lastMessagePreview
  const lastMessage = ticket.messages?.[ticket.messages.length - 1]
  return lastMessage?.body ?? ''
}

export function getTicketLastMessageTime(ticket: SupportTicketListItem | SupportTicketDetail) {
  return (
    ticket.lastMessageAt ??
    ticket.messages?.[ticket.messages.length - 1]?.createdAt ??
    ticket.updatedAt
  )
}

export function isSystemSupportMessage(message: SupportMessage) {
  return message.isSystem === true || message.kind === 'SYSTEM'
}

export function isAdminSupportMessage(message: SupportMessage) {
  if (isSystemSupportMessage(message)) return false
  return message.kind === 'ADMIN' || message.isAdmin || Boolean(message.adminId ?? message.admin?.id)
}

export function getAdminDisplayName(admin?: SupportAssignedAdmin | SupportMessage['admin'] | null) {
  if (!admin) return 'Admin'
  const fullName = `${admin.firstName ?? ''} ${admin.lastName ?? ''}`.trim()
  return fullName || admin.email || 'Admin'
}

export function getTicketUnreadCount(ticket: SupportTicketListItem | SupportTicketDetail) {
  if (typeof ticket.unreadCount === 'number') return ticket.unreadCount
  return ticket.hasUnread ? 1 : 0
}

export function getAvatarInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'A'
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}
