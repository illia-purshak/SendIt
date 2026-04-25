import axios, { type AxiosRequestConfig, type AxiosError } from 'axios'
import { APP_ROUTES } from '@/constants/app-routes'
import { API_ROUTES } from '@/constants/api-routes'
import { authStore } from '@/store/authStore'
import { toastStore } from '@/store/toastStore'

const API_BASE_URL = (import.meta.env.API_BASE_URL ?? '').replace(/\/+$/, '')

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  validateStatus: () => true,
})

// Inject Bearer token on every outgoing request
apiClient.interceptors.request.use(config => {
  const token = authStore.getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  } else {
    delete config.headers.Authorization
  }
  return config
})

// Single in-flight promise so parallel 401s wait for one refresh attempt.
let refreshing: Promise<string | null> | null = null

export async function silentRefresh(): Promise<string | null> {
  if (refreshing) return refreshing

  refreshing = apiClient
    .post<{ data?: { accessToken?: string } }>(API_ROUTES.auth.refresh)
    .then(response => {
      if (response.status < 200 || response.status >= 300) return null
      const token = response.data?.data?.accessToken
      if (!token) return null
      authStore.setToken(token)
      return token
    })
    .catch(() => null)
    .finally(() => { refreshing = null })

  return refreshing
}

// 401 handling: refresh once, then retry; redirect to login if refresh fails.
// Skipped for the refresh endpoint itself to prevent infinite loops.
apiClient.interceptors.response.use(async response => {
  const config = response.config as AxiosRequestConfig & { _retry?: boolean }

  if (
    response.status !== 401 ||
    config._retry ||
    config.url === API_ROUTES.auth.refresh
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

// Normalize network-level failures into user-friendly errors and surface them via toast.
// HTTP error statuses never reach this path because validateStatus always returns true.
apiClient.interceptors.response.use(null, (error: AxiosError) => {
  if (axios.isCancel(error)) return Promise.reject(error)

  let message = 'An unexpected error occurred'

  if (error.code === 'ECONNABORTED' || error.code === 'ERR_CANCELED') {
    message = 'Request timed out — please try again'
  } else if (!error.response) {
    // Server unreachable: network down, DNS failure, CORS preflight blocked, etc.
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
      message?: string[]
      success?: boolean
      error?: { message?: string }
    }

    if (body.statusCode === 400 && Array.isArray(body.message)) {
      return body.message[0] ?? 'Validation error'
    }

    if (body.success === false && body.error?.message) {
      return body.error.message
    }
  } catch {
    // ignore parse failure
  }

  return 'An unexpected error occurred'
}
