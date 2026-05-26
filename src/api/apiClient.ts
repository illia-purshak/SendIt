import axios, { type AxiosRequestConfig, type AxiosError } from 'axios'
import { APP_ROUTES } from '@/constants/app-routes'
import { API_ROUTES } from '@/constants/api-routes'
import { authStore } from '@/store/authStore'
import { toastStore } from '@/store/toastStore'

const API_BASE_URL = (import.meta.env.API_BASE_URL ?? '').replace(/\/+$/, '')

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  validateStatus: () => true,
})

apiClient.interceptors.request.use(config => {
  const token = authStore.getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  } else {
    delete config.headers.Authorization
  }
  return config
})

let refreshing: Promise<string | null> | null = null

export async function silentRefresh(): Promise<string | null> {
  if (refreshing) return refreshing

  const refreshToken = authStore.getRefreshToken()
  if (!refreshToken) return null

  refreshing = axios
    .post<{ accessToken: string; refreshToken: string; currentPlan?: import('@/types/subscription').CurrentPlan; scheduledPlan?: import('@/types/subscription').ScheduledPlan | null }>(
      `${API_BASE_URL}${API_ROUTES.auth.refresh}`,
      { refreshToken },
    )
    .then(response => {
      if (response.status < 200 || response.status >= 300) return null
      const { accessToken, refreshToken: newRefresh } = response.data
      if (!accessToken || !newRefresh) return null
      authStore.setTokens(accessToken, newRefresh)
      if (response.data.currentPlan) {
        authStore.setCurrentPlan(response.data.currentPlan, response.data.scheduledPlan ?? null)
      }
      return accessToken
    })
    .catch(() => null)
    .finally(() => {
      refreshing = null
    })

  return refreshing
}

const AUTH_NO_REFRESH_URLS = new Set<string>([
  API_ROUTES.auth.refresh,
  API_ROUTES.auth.login,
  API_ROUTES.auth.register,
  API_ROUTES.auth.twoFactor.verify,
  API_ROUTES.auth.completeProfile,
])

apiClient.interceptors.response.use(async response => {
  const config = response.config as AxiosRequestConfig & { _retry?: boolean }

  const responseCode = (response.data as { code?: string } | null)?.code
  if (responseCode === 'CONNECTION_INVALID') {
    toastStore.toast({
      title: 'Postal connection invalid',
      description: 'One of your operator connections is no longer valid. Update your API key in Profile.',
      color: 'warning',
    })
  }

  if (
    response.status !== 401 ||
    config._retry ||
    AUTH_NO_REFRESH_URLS.has(config.url as string)
  ) {
    return response
  }

  config._retry = true
  const newToken = await silentRefresh()

  if (!newToken) {
    authStore.clear()
    window.location.href = APP_ROUTES.login
    return response
  }

  return apiClient.request(config)
})

apiClient.interceptors.response.use(null, (error: AxiosError) => {
  if (axios.isCancel(error)) return Promise.reject(error)

  let message = 'An unexpected error occurred'

  if (error.code === 'ECONNABORTED' || error.code === 'ERR_CANCELED') {
    message = 'Request timed out — please try again'
  } else if (!error.response) {
    message = 'Network error — please check your connection'
  }

  toastStore.toast({ title: 'Error', description: message, color: 'error' })
  return Promise.reject(new Error(message))
})

export async function fetcher<T = unknown>(path: string) {
  return apiClient.get<T>(path)
}

export function parseError(data: unknown): string {
  try {
    const body = data as {
      statusCode?: number
      message?: string | string[]
      error?: string | { message?: string }
    }

    if (body.statusCode === 400 && Array.isArray(body.message)) {
      return body.message[0] ?? 'Validation error'
    }

    if (typeof body.message === 'string' && body.message) {
      return body.message
    }

    if (typeof body.error === 'object' && body.error?.message) {
      return body.error.message
    }
  } catch {
    // ignore parse failure
  }

  return 'An unexpected error occurred'
}
