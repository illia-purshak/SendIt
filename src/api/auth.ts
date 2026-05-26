import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient, fetcher, parseError, silentRefresh } from '@/api/apiClient'
import { authStore } from '@/store/authStore'
import { API_ROUTES } from '@/constants/api-routes'
import type {
  User,
  OrganizationProfile,
  CompleteOrganizationProfileBody,
  ProfileSettings,
  ProfileNotifications,
  UpdateProfileBody,
  UpdateSettingsBody,
} from '@/types/auth'
import type { CurrentPlan, ScheduledPlan } from '@/types/subscription'

export const AUTH_QUERY_KEY = ['auth', 'session'] as const
export const CURRENT_PLAN_QUERY_KEY = ['auth', 'current-plan'] as const

type LoginDirectResponse = {
  requires2FA: false
  accessToken: string
  refreshToken: string
  currentPlan: CurrentPlan
  scheduledPlan: ScheduledPlan | null
}
type Login2FAResponse = { requires2FA: true; pendingToken: string }
type LoginProfileResponse = { requiresProfileCompletion: true; profileSetupToken: string }
type LoginApiResponse = LoginDirectResponse | Login2FAResponse | LoginProfileResponse

export async function fetchCurrentUser(): Promise<User | null> {
  let token = authStore.getToken()
  if (!token) {
    token = await silentRefresh()
  }
  if (!token) return null

  const res = await fetcher<User>(API_ROUTES.auth.me)
  if (res.status < 200 || res.status >= 300) {
    authStore.clear()
    return null
  }
  return res.data
}

export function useSessionQuery() {
  return useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: fetchCurrentUser,
    staleTime: 5 * 60 * 1000,
  })
}

export type LoginMutationResult =
  | { requires2FA: true }
  | { requiresProfileCompletion: true }
  | User

export function useLoginMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const res = await apiClient.post<LoginApiResponse>(API_ROUTES.auth.login, { email, password })
      if (res.status < 200 || res.status >= 300) throw new Error(parseError(res.data))

      if ('requiresProfileCompletion' in res.data) {
        authStore.setProfileSetupToken(res.data.profileSetupToken)
        return { requiresProfileCompletion: true } as const
      }

      if (res.data.requires2FA) {
        authStore.setPendingToken(res.data.pendingToken)
        return { requires2FA: true } as const
      }

      authStore.setTokens(res.data.accessToken, res.data.refreshToken)
      authStore.setCurrentPlan(res.data.currentPlan, res.data.scheduledPlan)
      const user = await fetchCurrentUser()
      return user as User
    },
    onSuccess: result => {
      if (!('requires2FA' in result) && !('requiresProfileCompletion' in result)) {
        queryClient.setQueryData(AUTH_QUERY_KEY, result)
        queryClient.setQueryData(CURRENT_PLAN_QUERY_KEY, authStore.getCurrentPlan())
      }
    },
  })
}

export function useVerify2faMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ pendingToken, totpCode }: { pendingToken: string; totpCode: string }) => {
      const res = await apiClient.post<{
        accessToken: string
        refreshToken: string
        currentPlan: CurrentPlan
        scheduledPlan: ScheduledPlan | null
      }>(
        API_ROUTES.auth.twoFactor.verify,
        { pendingToken, totpCode },
      )
      if (res.status < 200 || res.status >= 300) throw new Error(parseError(res.data))

      authStore.clearPendingToken()
      authStore.setTokens(res.data.accessToken, res.data.refreshToken)
      authStore.setCurrentPlan(res.data.currentPlan, res.data.scheduledPlan)
      return fetchCurrentUser()
    },
    onSuccess: user => {
      queryClient.setQueryData(AUTH_QUERY_KEY, user)
      queryClient.setQueryData(CURRENT_PLAN_QUERY_KEY, authStore.getCurrentPlan())
    },
  })
}

type RegisterApiResponse = { requiresProfileCompletion: true; profileSetupToken: string }

export function useRegisterMutation() {
  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const res = await apiClient.post<RegisterApiResponse>(API_ROUTES.auth.register, { email, password })
      if (res.status < 200 || res.status >= 300) throw new Error(parseError(res.data))
      authStore.setProfileSetupToken(res.data.profileSetupToken)
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  return () => {
    const refreshToken = authStore.getRefreshToken()
    if (refreshToken) {
      apiClient.post(API_ROUTES.auth.logout, { refreshToken }).catch(() => {})
    }
    authStore.clear()
    queryClient.setQueryData(AUTH_QUERY_KEY, null)
  }
}

export function useCompleteOrganizationProfileMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: CompleteOrganizationProfileBody) => {
      const profileSetupToken = authStore.getProfileSetupToken()
      if (!profileSetupToken) throw new Error('Session expired — please register again')
      const res = await apiClient.post<{ accessToken: string; refreshToken: string }>(
        API_ROUTES.auth.completeProfile,
        { profileSetupToken, ...body },
      )
      if (res.status < 200 || res.status >= 300) throw new Error(parseError(res.data))
      authStore.clearProfileSetupToken()
      authStore.setTokens(res.data.accessToken, res.data.refreshToken)
      return fetchCurrentUser()
    },
    onSuccess: user => {
      queryClient.setQueryData(AUTH_QUERY_KEY, user)
    },
  })
}

export function useForgotPasswordMutation() {
  return useMutation({
    mutationFn: async (email: string) => {
      const res = await apiClient.post(API_ROUTES.auth.forgotPassword, { email })
      if (res.status < 200 || res.status >= 300) throw new Error(parseError(res.data))
    },
  })
}

export function useResetPasswordMutation() {
  return useMutation({
    mutationFn: async ({ token, password }: { token: string; password: string }) => {
      const res = await apiClient.post(API_ROUTES.auth.resetPassword, { token, newPassword: password })
      if (res.status < 200 || res.status >= 300) throw new Error(parseError(res.data))
    },
  })
}

export function useSetup2faMutation() {
  return useMutation({
    mutationFn: async () => {
      const res = await apiClient.post<{ qrCodeUrl: string; secret: string }>(
        API_ROUTES.auth.twoFactor.setup,
      )
      if (res.status < 200 || res.status >= 300) throw new Error(parseError(res.data))
      return res.data
    },
  })
}

export function useEnable2faMutation() {
  return useMutation({
    mutationFn: async (totpCode: string) => {
      const res = await apiClient.post(API_ROUTES.auth.twoFactor.enable, { totpCode })
      if (res.status < 200 || res.status >= 300) throw new Error(parseError(res.data))
    },
  })
}

export function useDisable2faMutation() {
  return useMutation({
    mutationFn: async (totpCode: string) => {
      const res = await apiClient.post(API_ROUTES.auth.twoFactor.disable, { totpCode })
      if (res.status < 200 || res.status >= 300) throw new Error(parseError(res.data))
    },
  })
}

export type FullProfileApiResponse = {
  id: number
  email: string | null
  phone: string | null
  avatarUrl: string | null
  profile: OrganizationProfile | null
  settings: ProfileSettings
  notifications: ProfileNotifications
}

export const PROFILE_QUERY_KEY = ['auth', 'profile-details'] as const

export function useProfileQuery() {
  return useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: async (): Promise<FullProfileApiResponse> => {
      const res = await fetcher<FullProfileApiResponse>(API_ROUTES.profile.me)
      if (res.status < 200 || res.status >= 300) throw new Error('Failed to load profile')
      return res.data
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: UpdateProfileBody) => {
      const res = await apiClient.put<FullProfileApiResponse>(API_ROUTES.profile.me, body)
      if (res.status < 200 || res.status >= 300) throw new Error(parseError(res.data))
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY })
    },
  })
}

export function useUpdateSettingsMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: UpdateSettingsBody) => {
      const res = await apiClient.put<{ language: string; timezone: string; dateFormat: string; notifications: ProfileNotifications }>(
        API_ROUTES.profile.settings,
        body,
      )
      if (res.status < 200 || res.status >= 300) throw new Error(parseError(res.data))
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY })
    },
  })
}

export function useChangePasswordMutation() {
  return useMutation({
    mutationFn: async (body: { currentPassword: string; newPassword: string }) => {
      const res = await apiClient.put<{ message: string }>(API_ROUTES.auth.password, body)
      if (res.status < 200 || res.status >= 300) throw new Error(parseError(res.data))
      return res.data
    },
  })
}

export function useCurrentPlanQuery() {
  return useQuery({
    queryKey: CURRENT_PLAN_QUERY_KEY,
    queryFn: () => authStore.getCurrentPlan(),
    staleTime: Infinity,
  })
}

export function useDeleteAccountMutation() {
  return useMutation({
    mutationFn: async () => {
      const res = await apiClient.delete(API_ROUTES.users.me)
      if (res.status < 200 || res.status >= 300) throw new Error(parseError(res.data))
    },
  })
}
