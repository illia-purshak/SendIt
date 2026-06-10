import { formatDate, formatDateTime, t } from "@/i18n/utils";
import type {
  SupportAssignedAdmin,
  SupportMessage,
  SupportTicketCategory,
  SupportTicketDetail,
  SupportTicketListItem,
  SupportTicketStatus,
} from "@/types/support";

export const SUPPORT_STATUS_CLASS: Record<SupportTicketStatus, string> = {
  WAITING: "bg-amber-100 text-amber-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  CLOSED: "bg-neutral-100 text-neutral-500",
  OPEN: "bg-amber-100 text-amber-800",
};

export const SUPPORT_CATEGORY_CLASS: Record<SupportTicketCategory, string> = {
  QUESTION: "bg-neutral-100 text-neutral-700",
  TECHNICAL: "bg-blue-50 text-blue-700",
  BILLING: "bg-emerald-50 text-emerald-700",
  SUGGESTION: "bg-violet-50 text-violet-700",
  OTHER: "bg-stone-100 text-stone-700",
};

export function isSupportTicketClosed(status: SupportTicketStatus) {
  return status === "CLOSED";
}

export function isSupportTicketActive(status: SupportTicketStatus) {
  return status === "WAITING" || status === "IN_PROGRESS" || status === "OPEN";
}

export function normalizeSupportStatus(status: SupportTicketStatus): SupportTicketStatus {
  return status === "OPEN" ? "WAITING" : status;
}

export function getSupportCategoryLabel(category?: SupportTicketCategory | null) {
  if (!category) return t("support.category.other");
  if (category === "QUESTION") return t("support.category.question");
  if (category === "TECHNICAL") return t("support.category.technical");
  if (category === "BILLING") return t("support.category.billing");
  if (category === "SUGGESTION") return t("support.category.suggestion");
  return t("support.category.other");
}

export function getSupportCategoryClass(category?: SupportTicketCategory | null) {
  if (!category) return SUPPORT_CATEGORY_CLASS.OTHER;
  return SUPPORT_CATEGORY_CLASS[category] ?? SUPPORT_CATEGORY_CLASS.OTHER;
}

export function getSupportStatusLabel(status: SupportTicketStatus) {
  if (status === "IN_PROGRESS") return t("support.status.inProgress");
  if (status === "CLOSED") return t("support.status.closed");
  return t("support.status.waiting");
}

export function getSupportStatusClass(status: SupportTicketStatus) {
  return SUPPORT_STATUS_CLASS[status] ?? SUPPORT_STATUS_CLASS.CLOSED;
}

export function formatRelativeTime(dateString?: string | null) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const diffSeconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));

  if (diffSeconds < 60) return t("common.justNow");
  if (diffSeconds < 3600) return t("common.minutesAgo", { count: Math.floor(diffSeconds / 60) });
  if (diffSeconds < 86400) return t("common.hoursAgo", { count: Math.floor(diffSeconds / 3600) });
  if (diffSeconds < 604800) return t("common.daysAgo", { count: Math.floor(diffSeconds / 86400) });
  return formatDate(date);
}

export function formatSupportTimestamp(dateString?: string | null) {
  if (!dateString) return "";
  return formatDateTime(dateString);
}

export function getTicketPreview(ticket: SupportTicketListItem | SupportTicketDetail) {
  if (ticket.lastMessagePreview) return ticket.lastMessagePreview;
  const lastMessage = ticket.messages?.[ticket.messages.length - 1];
  return lastMessage?.body ?? "";
}

export function getTicketLastMessageTime(ticket: SupportTicketListItem | SupportTicketDetail) {
  return (
    ticket.lastMessageAt ??
    ticket.messages?.[ticket.messages.length - 1]?.createdAt ??
    ticket.updatedAt
  );
}

export function isSystemSupportMessage(message: SupportMessage) {
  return message.isSystem === true || message.kind === "SYSTEM";
}

export function isAdminSupportMessage(message: SupportMessage) {
  if (isSystemSupportMessage(message)) return false;
  return message.kind === "ADMIN" || message.isAdmin || Boolean(message.adminId ?? message.admin?.id);
}

export function getAdminDisplayName(admin?: SupportAssignedAdmin | SupportMessage["admin"] | null) {
  if (!admin) return t("common.admin");
  const fullName = `${admin.firstName ?? ""} ${admin.lastName ?? ""}`.trim();
  return fullName || admin.email || t("common.admin");
}

export function getTicketUnreadCount(ticket: SupportTicketListItem | SupportTicketDetail) {
  if (typeof ticket.unreadCount === "number") return ticket.unreadCount;
  return ticket.hasUnread ? 1 : 0;
}

export function getAvatarInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "A";
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
