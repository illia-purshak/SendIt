import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminApiClient, parseAdminError } from '@/api/adminApiClient'
import { API_ROUTES } from '@/constants/api-routes'
import type { AdminService, AdminServicesResponse, AdminServiceCreateBody, AdminServiceUpdateBody } from '@/types/admin-service'

class AdminServiceError extends Error {
  readonly status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'AdminServiceError'
    this.status = status
  }
}

export class ServiceHasConnectionsError extends Error {
  readonly code = 'SERVICE_HAS_ACTIVE_CONNECTIONS'
  constructor() {
    super('Cannot delete — service has active connections')
    this.name = 'ServiceHasConnectionsError'
  }
}

const LIST_KEY = ['admin', 'services'] as const

export function useAdminServicesQuery() {
  return useQuery<AdminServicesResponse>({
    queryKey: LIST_KEY,
    queryFn: async () => {
      const res = await adminApiClient.get<AdminServicesResponse>(API_ROUTES.adminServices.list)
      if (res.status >= 200 && res.status < 300) return res.data
      throw new AdminServiceError(res.status, parseAdminError(res.data))
    },
  })
}

export function useAdminServiceQuery(id: number) {
  return useQuery<AdminService>({
    queryKey: ['admin', 'services', id],
    queryFn: async () => {
      const res = await adminApiClient.get<AdminService>(API_ROUTES.adminServices.detail(id))
      if (res.status >= 200 && res.status < 300) return res.data
      throw new AdminServiceError(res.status, parseAdminError(res.data))
    },
    enabled: Boolean(id),
  })
}

export function useAdminCreateServiceMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: AdminServiceCreateBody) => {
      const res = await adminApiClient.post<AdminService>(API_ROUTES.adminServices.list, body)
      if (res.status >= 200 && res.status < 300) return res.data
      throw new AdminServiceError(res.status, parseAdminError(res.data))
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: LIST_KEY }),
  })
}

export function useAdminUpdateServiceMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, body }: { id: number; body: AdminServiceUpdateBody }) => {
      const res = await adminApiClient.put<AdminService>(API_ROUTES.adminServices.detail(id), body)
      if (res.status >= 200 && res.status < 300) return res.data
      throw new AdminServiceError(res.status, parseAdminError(res.data))
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: LIST_KEY }),
  })
}

export function useAdminDeleteServiceMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await adminApiClient.delete(API_ROUTES.adminServices.detail(id))
      if (res.status === 204) return
      const code = (res.data as unknown as { code?: string })?.code
      if (res.status === 409 && code === 'SERVICE_HAS_ACTIVE_CONNECTIONS') {
        throw new ServiceHasConnectionsError()
      }
      throw new AdminServiceError(res.status, parseAdminError(res.data))
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: LIST_KEY }),
  })
}
