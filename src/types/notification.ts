import type { PaginatedResponse } from '@/types/pagination'

export type NotificationType = 'SUBSCRIPTION' | 'POSTAL_CONNECTION' | 'ACCOUNT' | 'SYSTEM' | 'SHIPMENT_STATUS'

export interface Notification {
  id: number
  type: NotificationType
  title: string
  body: string
  isRead: boolean
  createdAt: string
  updatedAt: string
}

export type NotificationsResponse = PaginatedResponse<Notification>

export interface UnreadCountResponse {
  count: number
}
