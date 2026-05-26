import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient, parseError } from '@/api/apiClient'
import { API_ROUTES } from '@/constants/api-routes'
import type { PaginatedResponse } from '@/types/pagination'
import type { Recipient, RecipientsResponse, RecipientBody, RecipientQueryParams } from '@/types/recipient'

class RecipientError extends Error {
  readonly status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'RecipientError'
    this.status = status
  }
}

const LIST_KEY = ['recipients'] as const

interface RawRecipientsResponse {
  items?: Recipient[]
  meta?: PaginatedResponse<Recipient>['meta']
  data?: Recipient[]
  total?: number
  page?: number
  limit?: number
}

function normalizeRecipientsResponse(data: RawRecipientsResponse): RecipientsResponse {
  if (Array.isArray(data.items) && data.meta) {
    return {
      items: data.items,
      meta: data.meta,
    }
  }

  const items = Array.isArray(data.data) ? data.data : []
  const totalItems = data.total ?? items.length
  const page = data.page ?? 1
  const pageSize = data.limit ?? 25
  const totalPages = Math.max(1, Math.ceil(totalItems / Math.max(pageSize, 1)))

  return {
    items,
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

export function useRecipientsQuery(params?: RecipientQueryParams) {
  return useQuery<RecipientsResponse>({
    queryKey: [...LIST_KEY, params],
    queryFn: async () => {
      const res = await apiClient.get<RawRecipientsResponse>(API_ROUTES.recipients.list, { params })
      if (res.status >= 200 && res.status < 300) return normalizeRecipientsResponse(res.data)
      throw new RecipientError(res.status, parseError(res.data))
    },
  })
}

export function useRecipientQuery(id: number, enabled = true) {
  return useQuery<Recipient>({
    queryKey: ['recipients', id],
    queryFn: async () => {
      const res = await apiClient.get<Recipient>(API_ROUTES.recipients.detail(id))
      if (res.status >= 200 && res.status < 300) return res.data
      throw new RecipientError(res.status, parseError(res.data))
    },
    enabled: enabled && Boolean(id),
  })
}

export function useCreateRecipientMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: RecipientBody) => {
      const res = await apiClient.post<Recipient>(API_ROUTES.recipients.list, body)
      if (res.status >= 200 && res.status < 300) return res.data
      throw new RecipientError(res.status, parseError(res.data))
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: LIST_KEY }),
  })
}

export function useUpdateRecipientMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, body }: { id: number; body: Partial<RecipientBody> }) => {
      const res = await apiClient.put<Recipient>(API_ROUTES.recipients.detail(id), body)
      if (res.status >= 200 && res.status < 300) return res.data
      throw new RecipientError(res.status, parseError(res.data))
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: LIST_KEY }),
  })
}

export function useDeleteRecipientMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient.delete(API_ROUTES.recipients.detail(id))
      if (res.status === 204) return
      throw new RecipientError(res.status, parseError(res.data))
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: LIST_KEY }),
  })
}
