import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminApiClient, parseAdminError } from '@/api/adminApiClient'
import { API_ROUTES } from '@/constants/api-routes'
import type { AdminUserListItem, AdminUsersResponse, AdminUserQueryParams } from '@/types/admin-user'

class AdminUserError extends Error {
  readonly status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'AdminUserError'
    this.status = status
  }
}

const LIST_KEY = ['admin', 'users'] as const

export function useAdminUsersQuery(params: AdminUserQueryParams) {
  return useQuery<AdminUsersResponse>({
    queryKey: [...LIST_KEY, params],
    queryFn: async () => {
      const res = await adminApiClient.get<AdminUsersResponse>(API_ROUTES.adminUsers.list, {
        params: {
          ...(params.plan ? { plan: params.plan } : {}),
          ...(params.status ? { status: params.status } : {}),
          ...(params.search ? { search: params.search } : {}),
          page: params.page ?? 1,
          limit: params.limit ?? 20,
        },
      })
      if (res.status >= 200 && res.status < 300) return res.data
      throw new AdminUserError(res.status, parseAdminError(res.data))
    },
  })
}

export function useAdminUserQuery(id: number) {
  return useQuery<AdminUserListItem>({
    queryKey: ['admin', 'users', id],
    queryFn: async () => {
      const res = await adminApiClient.get<AdminUserListItem>(API_ROUTES.adminUsers.detail(id))
      if (res.status >= 200 && res.status < 300) return res.data
      throw new AdminUserError(res.status, parseAdminError(res.data))
    },
    enabled: Boolean(id),
  })
}

export function useAdminUpdateUserStatusMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await adminApiClient.put(API_ROUTES.adminUsers.detail(id), { status })
      if (res.status >= 200 && res.status < 300) return res.data
      throw new AdminUserError(res.status, parseAdminError(res.data))
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: LIST_KEY }),
  })
}
