import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminApiClient, parseAdminError } from '@/api/adminApiClient'
import { normalizeSupportListResponse, normalizeSupportTicketDetail } from '@/api/support-normalizers'
import { API_ROUTES } from '@/constants/api-routes'
import type {
  AdminSupportQueryParams,
  SupportTicketDetail,
  SupportTicketsResponse,
} from '@/types/admin-support'

class AdminSupportError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'AdminSupportError'
    this.status = status
  }
}

export class TicketClosedError extends Error {
  constructor() {
    super('Cannot reply - this ticket is already closed')
    this.name = 'TicketClosedError'
  }
}

const LIST_KEY = ['admin', 'support', 'tickets'] as const

export function useAdminTicketsQuery(params?: AdminSupportQueryParams) {
  return useQuery<SupportTicketsResponse>({
    queryKey: [...LIST_KEY, params],
    queryFn: async () => {
      const endpoint =
        params?.assigned === 'me'
          ? API_ROUTES.adminSupport.myTickets
          : API_ROUTES.adminSupport.tickets
      const queryParams =
        params?.assigned === 'me'
          ? {
              status: params.status,
              page: params.page,
              limit: params.limit,
            }
          : {
              status: params?.status,
              category: params?.category,
              search: params?.search,
              page: params?.page,
              limit: params?.limit,
            }
      const res = await adminApiClient.get<SupportTicketsResponse>(
        endpoint,
        { params: queryParams },
      )
      if (res.status >= 200 && res.status < 300) return normalizeSupportListResponse(res.data)
      throw new AdminSupportError(res.status, parseAdminError(res.data))
    },
    staleTime: 30_000,
  })
}

export function useAdminTicketQuery(id: number) {
  return useQuery<SupportTicketDetail>({
    queryKey: [...LIST_KEY, id],
    queryFn: async () => {
      const res = await adminApiClient.get<SupportTicketDetail>(
        API_ROUTES.adminSupport.ticket(id),
      )
      if (res.status >= 200 && res.status < 300) return normalizeSupportTicketDetail(res.data)
      throw new AdminSupportError(res.status, parseAdminError(res.data))
    },
    enabled: Boolean(id),
  })
}

export function useAdminUpdateTicketMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, action }: { id: number; action: 'assign' | 'leave' | 'close' }) => {
      const res = await adminApiClient.put(API_ROUTES.adminSupport.ticket(id), { action })
      if (res.status >= 200 && res.status < 300) return res.data
      throw new AdminSupportError(res.status, parseAdminError(res.data))
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: LIST_KEY }),
  })
}

export function useAdminMarkTicketReadMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (ticketId: number) => {
      const res = await adminApiClient.put(API_ROUTES.adminSupport.ticketRead(ticketId))
      if (res.status >= 200 && res.status < 300) return res.data
      throw new AdminSupportError(res.status, parseAdminError(res.data))
    },
    onSuccess: (_data, ticketId) => {
      qc.invalidateQueries({ queryKey: LIST_KEY })
      qc.invalidateQueries({ queryKey: [...LIST_KEY, ticketId] })
    },
  })
}

export function useAdminPostMessageMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ ticketId, body }: { ticketId: number; body: string }) => {
      const res = await adminApiClient.post(API_ROUTES.adminSupport.ticketMessage(ticketId), { body })
      if (res.status >= 200 && res.status < 300) return res.data
      const code = (res.data as { code?: string } | undefined)?.code
      if (res.status === 403 && code === 'TICKET_CLOSED') throw new TicketClosedError()
      throw new AdminSupportError(res.status, parseAdminError(res.data))
    },
    onSuccess: (_data, { ticketId }) => {
      qc.invalidateQueries({ queryKey: LIST_KEY })
      qc.invalidateQueries({ queryKey: [...LIST_KEY, ticketId] })
    },
  })
}
