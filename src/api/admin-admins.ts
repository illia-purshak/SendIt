import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminApiClient, parseAdminError } from '@/api/adminApiClient'
import { API_ROUTES } from '@/constants/api-routes'
import type { AdminMember, AdminMembersResponse, AdminInviteBody, AdminInviteResponse, AdminResendInviteResponse } from '@/types/admin-admin'

class AdminMemberError extends Error {
  readonly status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'AdminMemberError'
    this.status = status
  }
}

export class AdminInviteConflictError extends Error {
  constructor() {
    super('An invite for this email is already pending or the email is already in use')
    this.name = 'AdminInviteConflictError'
  }
}

const LIST_KEY = ['admin', 'admins'] as const

export function useAdminMembersQuery(params?: { status?: string; search?: string; page?: number; limit?: number }) {
  return useQuery<AdminMembersResponse>({
    queryKey: [...LIST_KEY, params],
    queryFn: async () => {
      const res = await adminApiClient.get<AdminMembersResponse>(API_ROUTES.adminAdmins.list, { params })
      if (res.status >= 200 && res.status < 300) return res.data
      throw new AdminMemberError(res.status, parseAdminError(res.data))
    },
  })
}

export function useAdminMemberQuery(id: number) {
  return useQuery<AdminMember>({
    queryKey: ['admin', 'admins', id],
    queryFn: async () => {
      const res = await adminApiClient.get<AdminMember>(API_ROUTES.adminAdmins.detail(id))
      if (res.status >= 200 && res.status < 300) return res.data
      throw new AdminMemberError(res.status, parseAdminError(res.data))
    },
    enabled: Boolean(id),
  })
}

export function useAdminInviteMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: AdminInviteBody) => {
      const res = await adminApiClient.post<AdminInviteResponse>(API_ROUTES.adminAdmins.invite, body)
      if (res.status >= 200 && res.status < 300) return res.data
      if (res.status === 409) throw new AdminInviteConflictError()
      throw new AdminMemberError(res.status, parseAdminError(res.data))
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: LIST_KEY }),
  })
}

export function useAdminUpdateMemberMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await adminApiClient.put(API_ROUTES.adminAdmins.detail(id), { status })
      if (res.status >= 200 && res.status < 300) return res.data
      throw new AdminMemberError(res.status, parseAdminError(res.data))
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: LIST_KEY }),
  })
}

export function useAdminDeleteMemberMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await adminApiClient.delete(API_ROUTES.adminAdmins.detail(id))
      if (res.status === 204) return
      throw new AdminMemberError(res.status, parseAdminError(res.data))
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: LIST_KEY }),
  })
}

export function useAdminResendInviteMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await adminApiClient.post<AdminResendInviteResponse>(API_ROUTES.adminAdmins.resendInvite(id))
      if (res.status >= 200 && res.status < 300) return res.data
      throw new AdminMemberError(res.status, parseAdminError(res.data))
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: LIST_KEY }),
  })
}
