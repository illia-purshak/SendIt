import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient, fetcher, parseError } from '@/api/apiClient'
import { API_ROUTES } from '@/constants/api-routes'
import type { ParcelTemplate, ParcelTemplateBody } from '@/types/parcel-templates'

type ApiResponse<T> = { data: T } | { success: boolean; data: T } | T

function unwrap<T>(payload: ApiResponse<T>): T {
  if (payload !== null && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data: T }).data
  }
  return payload as T
}

export const PARCEL_TEMPLATES_QUERY_KEY = ['parcel-templates'] as const

export async function getParcelTemplates(): Promise<ParcelTemplate[]> {
  const res = await fetcher<ApiResponse<ParcelTemplate[]>>(API_ROUTES.parcelTemplates.list)
  if (res.status < 200 || res.status >= 300) throw new Error(parseError(res.data))
  return unwrap(res.data)
}

export async function getParcelTemplateById(id: number): Promise<ParcelTemplate> {
  const res = await fetcher<ApiResponse<ParcelTemplate>>(API_ROUTES.parcelTemplates.detail(id))
  if (res.status < 200 || res.status >= 300) throw new Error(parseError(res.data))
  return unwrap(res.data)
}

export function useParcelTemplatesQuery() {
  return useQuery({
    queryKey: PARCEL_TEMPLATES_QUERY_KEY,
    queryFn: getParcelTemplates,
    staleTime: 2 * 60 * 1000,
  })
}

export function useParcelTemplateQuery(id: number) {
  return useQuery({
    queryKey: [...PARCEL_TEMPLATES_QUERY_KEY, id],
    queryFn: () => getParcelTemplateById(id),
    staleTime: 2 * 60 * 1000,
    enabled: id > 0,
  })
}

export function useCreateParcelTemplateMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: ParcelTemplateBody) => {
      const res = await apiClient.post<ApiResponse<ParcelTemplate>>(
        API_ROUTES.parcelTemplates.list,
        body,
      )
      if (res.status < 200 || res.status >= 300) throw new Error(parseError(res.data))
      return unwrap(res.data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PARCEL_TEMPLATES_QUERY_KEY })
    },
  })
}

export function useUpdateParcelTemplateMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, body }: { id: number; body: ParcelTemplateBody }) => {
      const res = await apiClient.put<ApiResponse<ParcelTemplate>>(
        API_ROUTES.parcelTemplates.detail(id),
        body,
      )
      if (res.status < 200 || res.status >= 300) throw new Error(parseError(res.data))
      return unwrap(res.data)
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: PARCEL_TEMPLATES_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: [...PARCEL_TEMPLATES_QUERY_KEY, id] })
    },
  })
}

export function useSetDefaultParcelTemplateMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient.patch<ApiResponse<ParcelTemplate>>(
        API_ROUTES.parcelTemplates.setDefault(id),
      )
      if (res.status < 200 || res.status >= 300) throw new Error(parseError(res.data))
      return unwrap(res.data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PARCEL_TEMPLATES_QUERY_KEY })
    },
  })
}

export function useDeleteParcelTemplateMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient.delete(API_ROUTES.parcelTemplates.detail(id))
      if (res.status < 200 || res.status >= 300) throw new Error(parseError(res.data))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PARCEL_TEMPLATES_QUERY_KEY })
    },
  })
}
