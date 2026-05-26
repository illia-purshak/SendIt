import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient, parseError } from '@/api/apiClient'
import { API_ROUTES } from '@/constants/api-routes'
import type { Notification, NotificationType, NotificationsResponse, UnreadCountResponse } from '@/types/notification'

class NotificationError extends Error {
  readonly status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'NotificationError'
    this.status = status
  }
}

const LIST_KEY = ['notifications'] as const
const UNREAD_KEY = ['notifications', 'unread-count'] as const

export function useNotificationsQuery(tab: 'all' | 'unread' = 'all', type?: NotificationType, page = 1) {
  return useQuery<NotificationsResponse>({
    queryKey: [...LIST_KEY, tab, type, page],
    queryFn: async () => {
      const res = await apiClient.get<NotificationsResponse>(API_ROUTES.notifications.list, {
        params: { tab, type, page, limit: 25 },
      })
      if (res.status >= 200 && res.status < 300) return res.data
      throw new NotificationError(res.status, parseError(res.data))
    },
  })
}

export function useUnreadCountQuery() {
  return useQuery<UnreadCountResponse>({
    queryKey: UNREAD_KEY,
    queryFn: async () => {
      const res = await apiClient.get<UnreadCountResponse>(API_ROUTES.notifications.unreadCount)
      if (res.status >= 200 && res.status < 300) return res.data
      throw new NotificationError(res.status, parseError(res.data))
    },
    refetchInterval: 60_000,
  })
}

export function useMarkReadMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient.put<Notification>(API_ROUTES.notifications.single(id))
      if (res.status >= 200 && res.status < 300) return res.data
      throw new NotificationError(res.status, parseError(res.data))
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LIST_KEY })
      qc.invalidateQueries({ queryKey: UNREAD_KEY })
    },
  })
}

export function useMarkAllReadMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const res = await apiClient.put<{ updated: number }>(API_ROUTES.notifications.list)
      if (res.status >= 200 && res.status < 300) return res.data
      throw new NotificationError(res.status, parseError(res.data))
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LIST_KEY })
      qc.invalidateQueries({ queryKey: UNREAD_KEY })
    },
  })
}

export function useDeleteNotificationMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient.delete(API_ROUTES.notifications.single(id))
      if (res.status === 204) return
      throw new NotificationError(res.status, parseError(res.data))
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LIST_KEY })
      qc.invalidateQueries({ queryKey: UNREAD_KEY })
    },
  })
}

export function useDeleteReadNotificationsMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const res = await apiClient.delete(API_ROUTES.notifications.list, {
        params: { filter: 'read' },
      })
      if (res.status === 204) return
      throw new NotificationError(res.status, parseError(res.data))
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LIST_KEY })
      qc.invalidateQueries({ queryKey: UNREAD_KEY })
    },
  })
}

export function useDeleteAllNotificationsMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const res = await apiClient.delete(API_ROUTES.notifications.list)
      if (res.status === 204) return
      throw new NotificationError(res.status, parseError(res.data))
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LIST_KEY })
      qc.invalidateQueries({ queryKey: UNREAD_KEY })
    },
  })
}
