import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient, fetcher, parseError, silentRefresh } from '@/api/apiClient'
import { authStore } from '@/store/authStore'
import { API_ROUTES } from '@/constants/api-routes'
import type {
  User,
  IndividualProfile,
  OrganizationProfile,
  RegisterBody,
  CompleteIndividualProfileBody,
  CompleteOrganizationProfileBody,
} from '@/types/auth'

export const AUTH_QUERY_KEY = ['auth', 'session'] as const

type ProfileDetails = IndividualProfile | OrganizationProfile
type UserPayload = User | [User, ProfileDetails?]
type UserResponse = User | { data: UserPayload } | { success: boolean; data: UserPayload }
type LoginResponse = { data: { accessToken: string } }

function unwrapUser(payload: UserResponse): User {
  const data = 'data' in payload ? payload.data : payload
  return Array.isArray(data) ? data[0] : data
}

export async function fetchCurrentUser(): Promise<User | null> {
  // Pre-check avoids a 401→redirect cycle when the app loads without a session.
  let token = authStore.getToken()
  if (!token) {
    token = await silentRefresh()
  }
  if (!token) {
    token = authStore.getToken()
  }
  if (!token) return null

  const res = await fetcher<UserResponse>(API_ROUTES.auth.me)
  if (res.status < 200 || res.status >= 300) {
    authStore.clear()
    return null
  }
  return unwrapUser(res.data)
}

export function useSessionQuery() {
  return useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: fetchCurrentUser,
    staleTime: 5 * 60 * 1000,
  })
}

export function useLoginMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const res = await apiClient.post<LoginResponse>(API_ROUTES.auth.login, { email, password })
      if (res.status < 200 || res.status >= 300) throw new Error(parseError(res.data))
      authStore.setToken(res.data.data.accessToken)
      return fetchCurrentUser()
    },
    onSuccess: user => {
      queryClient.setQueryData(AUTH_QUERY_KEY, user)
    },
  })
}

export function useRegisterMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: RegisterBody) => {
      const registerRes = await apiClient.post(API_ROUTES.auth.register, body)
      if (registerRes.status < 200 || registerRes.status >= 300) {
        throw new Error(parseError(registerRes.data))
      }

      const loginRes = await apiClient.post<LoginResponse>(API_ROUTES.auth.login, {
        email: body.email,
        password: body.password,
      })
      if (loginRes.status < 200 || loginRes.status >= 300) {
        throw new Error(parseError(loginRes.data))
      }

      authStore.setToken(loginRes.data.data.accessToken)
      return fetchCurrentUser()
    },
    onSuccess: user => {
      queryClient.setQueryData(AUTH_QUERY_KEY, user)
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  return () => {
    authStore.clear()
    queryClient.setQueryData(AUTH_QUERY_KEY, null)
  }
}

export function useCompleteIndividualProfileMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: CompleteIndividualProfileBody) => {
      const res = await apiClient.post<UserResponse>(
        API_ROUTES.auth.completeProfile.individual,
        body,
      )
      if (res.status < 200 || res.status >= 300) throw new Error(parseError(res.data))
      return unwrapUser(res.data)
    },
    onSuccess: user => {
      queryClient.setQueryData(AUTH_QUERY_KEY, user)
    },
  })
}

export function useCompleteOrganizationProfileMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: CompleteOrganizationProfileBody) => {
      const res = await apiClient.post<UserResponse>(
        API_ROUTES.auth.completeProfile.organization,
        body,
      )
      if (res.status < 200 || res.status >= 300) throw new Error(parseError(res.data))
      return unwrapUser(res.data)
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
      const res = await apiClient.post(API_ROUTES.auth.resetPassword, { token, password })
      if (res.status < 200 || res.status >= 300) throw new Error(parseError(res.data))
    },
  })
}
