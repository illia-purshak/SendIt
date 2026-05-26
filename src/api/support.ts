import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient, parseError } from '@/api/apiClient'
import { normalizeSupportListResponse, normalizeSupportTicketDetail } from '@/api/support-normalizers'
import { API_ROUTES } from '@/constants/api-routes'
import type {
  ClientSupportQueryParams,
  SupportTicketDetail,
  SupportTicketsResponse,
} from '@/types/support'

class SupportError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'SupportError'
    this.status = status
  }
}

const LIST_KEY = ['support', 'tickets'] as const

export function useSupportTicketsQuery(params?: ClientSupportQueryParams) {
  return useQuery<SupportTicketsResponse>({
    queryKey: [...LIST_KEY, params],
    queryFn: async () => {
      const res = await apiClient.get<SupportTicketsResponse>(API_ROUTES.support.tickets, {
        params,
      })
      if (res.status >= 200 && res.status < 300) return normalizeSupportListResponse(res.data)
      throw new SupportError(res.status, parseError(res.data))
    },
    staleTime: 30_000,
  })
}

export function useSupportTicketQuery(id: number) {
  return useQuery<SupportTicketDetail>({
    queryKey: [...LIST_KEY, id],
    queryFn: async () => {
      const res = await apiClient.get<SupportTicketDetail>(API_ROUTES.support.ticket(id))
      if (res.status >= 200 && res.status < 300) return normalizeSupportTicketDetail(res.data)
      throw new SupportError(res.status, parseError(res.data))
    },
    enabled: Boolean(id),
  })
}

export function useCreateSupportTicketMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: { subject: string; category: string; body: string }) => {
      const res = await apiClient.post(API_ROUTES.support.tickets, body)
      if (res.status >= 200 && res.status < 300) return normalizeSupportTicketDetail(res.data)
      throw new SupportError(res.status, parseError(res.data))
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LIST_KEY })
    },
  })
}

export function usePostSupportMessageMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ ticketId, body }: { ticketId: number; body: string }) => {
      const res = await apiClient.put(API_ROUTES.support.ticketMessage(ticketId), { body })
      if (res.status >= 200 && res.status < 300) return res.data
      throw new SupportError(res.status, parseError(res.data))
    },
    onSuccess: (_data, { ticketId }) => {
      qc.invalidateQueries({ queryKey: LIST_KEY })
      qc.invalidateQueries({ queryKey: [...LIST_KEY, ticketId] })
    },
  })
}

export function useMarkSupportTicketReadMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (ticketId: number) => {
      const res = await apiClient.put(API_ROUTES.support.ticketRead(ticketId))
      if (res.status >= 200 && res.status < 300) return res.data
      throw new SupportError(res.status, parseError(res.data))
    },
    onSuccess: (_data, ticketId) => {
      qc.invalidateQueries({ queryKey: LIST_KEY })
      qc.invalidateQueries({ queryKey: [...LIST_KEY, ticketId] })
    },
  })
}
