import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient, parseError } from '@/api/apiClient'
import { API_ROUTES } from '@/constants/api-routes'
import type { Draft, DraftsResponse, DraftBody } from '@/types/draft'

class DraftError extends Error {
  readonly status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'DraftError'
    this.status = status
  }
}

const LIST_KEY = ['drafts'] as const

export function useDraftsQuery() {
  return useQuery<DraftsResponse>({
    queryKey: LIST_KEY,
    queryFn: async () => {
      const res = await apiClient.get<DraftsResponse>(API_ROUTES.drafts.list)
      if (res.status >= 200 && res.status < 300) return res.data
      throw new DraftError(res.status, parseError(res.data))
    },
  })
}

export function useDraftQuery(id: number) {
  return useQuery<Draft>({
    queryKey: ['drafts', id],
    queryFn: async () => {
      const res = await apiClient.get<Draft>(API_ROUTES.drafts.detail(id))
      if (res.status >= 200 && res.status < 300) return res.data
      throw new DraftError(res.status, parseError(res.data))
    },
    enabled: Boolean(id),
  })
}

export function useCreateDraftMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: DraftBody) => {
      const res = await apiClient.post<Draft>(API_ROUTES.drafts.list, body)
      if (res.status >= 200 && res.status < 300) return res.data
      throw new DraftError(res.status, parseError(res.data))
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: LIST_KEY }),
  })
}

export function useUpdateDraftMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, body }: { id: number; body: DraftBody }) => {
      const res = await apiClient.put<Draft>(API_ROUTES.drafts.detail(id), body)
      if (res.status >= 200 && res.status < 300) return res.data
      throw new DraftError(res.status, parseError(res.data))
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: LIST_KEY }),
  })
}

export function useDeleteDraftMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient.delete(API_ROUTES.drafts.detail(id))
      if (res.status === 204) return
      throw new DraftError(res.status, parseError(res.data))
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: LIST_KEY }),
  })
}
