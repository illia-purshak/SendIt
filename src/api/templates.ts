import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient, parseError } from '@/api/apiClient'
import { API_ROUTES } from '@/constants/api-routes'
import type { Template, TemplatesResponse, TemplateBody, TemplateQueryParams } from '@/types/template'

class TemplateError extends Error {
  readonly status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'TemplateError'
    this.status = status
  }
}

const LIST_KEY = ['templates'] as const

export function useTemplatesQuery(params?: TemplateQueryParams) {
  return useQuery<TemplatesResponse>({
    queryKey: [...LIST_KEY, params],
    queryFn: async () => {
      const res = await apiClient.get<TemplatesResponse>(API_ROUTES.templates.list, { params })
      if (res.status >= 200 && res.status < 300) return res.data
      throw new TemplateError(res.status, parseError(res.data))
    },
    staleTime: 1000 * 60 * 2,
  })
}

export function useTemplateQuery(id: number) {
  return useQuery<Template>({
    queryKey: ['templates', id],
    queryFn: async () => {
      const res = await apiClient.get<Template>(API_ROUTES.templates.detail(id))
      if (res.status >= 200 && res.status < 300) return res.data
      throw new TemplateError(res.status, parseError(res.data))
    },
    enabled: Boolean(id),
  })
}

export function useCreateTemplateMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: TemplateBody) => {
      const res = await apiClient.post<Template>(API_ROUTES.templates.list, body)
      if (res.status >= 200 && res.status < 300) return res.data
      throw new TemplateError(res.status, parseError(res.data))
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: LIST_KEY }),
  })
}

export function useUpdateTemplateMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, body }: { id: number; body: Partial<TemplateBody> }) => {
      const res = await apiClient.put<Template>(API_ROUTES.templates.detail(id), body)
      if (res.status >= 200 && res.status < 300) return res.data
      throw new TemplateError(res.status, parseError(res.data))
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: LIST_KEY }),
  })
}

export function useDeleteTemplateMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient.delete(API_ROUTES.templates.detail(id))
      if (res.status === 204) return
      throw new TemplateError(res.status, parseError(res.data))
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: LIST_KEY }),
  })
}

export function useIncrementTemplateUsageMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient.post<{ id: number; usageCount: number }>(
        API_ROUTES.templates.incrementUsage(id),
      )
      if (res.status >= 200 && res.status < 300) return res.data
      throw new TemplateError(res.status, parseError(res.data))
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: LIST_KEY }),
  })
}
