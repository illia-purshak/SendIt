import { useMutation, useQuery } from '@tanstack/react-query'
import { adminApiClient, parseAdminError } from '@/api/adminApiClient'
import { adminTokenStore } from '@/store/adminTokenStore'
import { API_ROUTES } from '@/constants/api-routes'

type AdminInfo = { id: number; email: string; isSuperAdmin: boolean; status: string }
type AdminLoginSuccessResponse = { requires2FA: false; accessToken: string; refreshToken: string }
type AdminLogin2FAResponse = { requires2FA: true; pendingToken: string }
type AdminLoginSetupResponse = { requiresSetup: true; setupToken: string }
type AdminLoginApiResponse = AdminLoginSuccessResponse | AdminLogin2FAResponse | AdminLoginSetupResponse

function parseJwtPayload(token: string): Record<string, unknown> {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(base64)) as Record<string, unknown>
  } catch {
    return {}
  }
}

function isDirectSuccess(r: AdminLoginApiResponse): r is AdminLoginSuccessResponse {
  return 'requires2FA' in r && (r as AdminLoginSuccessResponse).requires2FA === false
}

function isSetupRequired(r: AdminLoginApiResponse): r is AdminLoginSetupResponse {
  return 'requiresSetup' in r && (r as AdminLoginSetupResponse).requiresSetup === true
}

export function useAdminLoginMutation() {
  return useMutation({
    mutationFn: async ({ email, password, totpCode }: { email: string; password: string; totpCode?: string }) => {
      const res = await adminApiClient.post<AdminLoginApiResponse>(
        API_ROUTES.adminAuth.login,
        { email, password, ...(totpCode ? { totpCode } : {}) },
      )

      if (res.status < 200 || res.status >= 300) throw new Error(parseAdminError(res.data))

      const data = res.data
      if (isSetupRequired(data)) {
        adminTokenStore.setSetupToken(data.setupToken)
        return { requiresSetup: true as const }
      }

      if (!isDirectSuccess(data)) {
        adminTokenStore.setPendingToken(data.pendingToken)
        return { requires2FA: true as const }
      }

      adminTokenStore.setTokens(data.accessToken, data.refreshToken)
      adminTokenStore.setIsSuperAdmin(parseJwtPayload(data.accessToken).isSuperAdmin === true)
      return { requires2FA: false as const }
    },
  })
}

export function useAdminVerify2faMutation() {
  return useMutation({
    mutationFn: async ({ pendingToken, totpCode }: { pendingToken: string; totpCode: string }) => {
      const res = await adminApiClient.post<{ accessToken: string; refreshToken: string; admin?: AdminInfo }>(
        API_ROUTES.adminAuth.verify2fa,
        { pendingToken, totpCode },
      )
      if (res.status < 200 || res.status >= 300) throw new Error(parseAdminError(res.data))

      adminTokenStore.clearPendingToken()
      adminTokenStore.setTokens(res.data.accessToken, res.data.refreshToken)
      if (res.data.admin) {
        adminTokenStore.setIsSuperAdmin(res.data.admin.isSuperAdmin)
        adminTokenStore.setSession({
          email: res.data.admin.email,
          isSuperAdmin: res.data.admin.isSuperAdmin,
        })
      }
    },
  })
}

export function useAdminValidateInviteQuery(token: string | null) {
  return useQuery<{ email: string; valid: true }>({
    queryKey: ['admin', 'invite', token],
    queryFn: async () => {
      if (!token) throw new Error('No token')
      const res = await adminApiClient.get(API_ROUTES.adminAuth.validateInvite(token))
      if (res.status >= 200 && res.status < 300) return res.data
      const errorCode = (res.data as { code?: string })?.code
      const err = new Error(parseAdminError(res.data)) as Error & { status: number; code?: string }
      err.status = res.status
      err.code = errorCode
      throw err
    },
    enabled: Boolean(token),
    retry: false,
  })
}

export function useAdminSetPasswordMutation() {
  return useMutation({
    mutationFn: async ({ token, password }: { token: string; password: string }) => {
      const res = await adminApiClient.post(API_ROUTES.adminAuth.setPassword, { token, password })
      if (res.status < 200 || res.status >= 300) throw new Error(parseAdminError(res.data))
    },
  })
}

export function useAdminAcceptInviteMutation() {
  return useMutation({
    mutationFn: async (body: {
      token: string
      password: string
      firstName: string
      lastName: string
    }) => {
      const res = await adminApiClient.post<{ setupToken: string }>(
        API_ROUTES.adminAuth.acceptInvite,
        body,
      )
      if (res.status < 200 || res.status >= 300) throw new Error(parseAdminError(res.data))

      adminTokenStore.setSetupToken(res.data.setupToken)
    },
  })
}

export function useAdmin2faSetupMutation() {
  return useMutation({
    mutationFn: async (body?: { token?: string }) => {
      const res = await adminApiClient.post<{ qrCodeUrl: string; secret: string }>(
        API_ROUTES.adminAuth.twoFactor.setup,
        body ?? {},
      )
      if (res.status < 200 || res.status >= 300) throw new Error(parseAdminError(res.data))
      return res.data
    },
  })
}

export function useAdmin2faVerifySetupMutation() {
  return useMutation({
    mutationFn: async ({ token, secret, totpCode }: { token: string; secret: string; totpCode: string }) => {
      const res = await adminApiClient.post<{ accessToken: string; refreshToken: string; admin: AdminInfo }>(
        API_ROUTES.adminAuth.twoFactor.verifySetup,
        { token, secret, totpCode },
      )
      if (res.status < 200 || res.status >= 300) throw new Error(parseAdminError(res.data))

      adminTokenStore.setTokens(res.data.accessToken, res.data.refreshToken)
      adminTokenStore.setIsSuperAdmin(res.data.admin.isSuperAdmin)
      adminTokenStore.setSession({
        email: res.data.admin.email,
        isSuperAdmin: res.data.admin.isSuperAdmin,
      })
    },
  })
}

export function useAdmin2faEnableMutation() {
  return useMutation({
    mutationFn: async (totpCode: string) => {
      const res = await adminApiClient.post<{ accessToken: string; refreshToken: string }>(
        API_ROUTES.adminAuth.twoFactor.enable,
        { totpCode },
      )
      if (res.status < 200 || res.status >= 300) throw new Error(parseAdminError(res.data))

      adminTokenStore.clearSetupToken()
      adminTokenStore.setTokens(res.data.accessToken, res.data.refreshToken)
    },
  })
}

export function useAdminLogoutMutation() {
  return useMutation({
    mutationFn: async () => {
      const refreshToken = adminTokenStore.getRefreshToken()
      if (refreshToken) {
        await adminApiClient.delete(API_ROUTES.adminAuth.logout, { data: { refreshToken } })
      }
      adminTokenStore.clear()
    },
  })
}
