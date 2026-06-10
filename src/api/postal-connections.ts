import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient, parseError } from '@/api/apiClient'
import { API_ROUTES } from '@/constants/api-routes'
import type { PostalConnectionsResponse, NovaPoshtataDivisionsResponse } from '@/types/postal-connections'
import type { ApiErrorResponse } from '@/types/api-error'

export class PostalConnectionError extends Error {
  readonly status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'PostalConnectionError'
    this.status = status
  }
}

export class ConnectionAlreadyExistsError extends Error {
  readonly code = 'CONNECTION_ALREADY_EXISTS'
  constructor() {
    super('Connection already exists — use Update key instead')
    this.name = 'ConnectionAlreadyExistsError'
  }
}

export class ConnectionNotFoundError extends Error {
  readonly code = 'CONNECTION_NOT_FOUND'
  constructor() {
    super('No connection found — connect first')
    this.name = 'ConnectionNotFoundError'
  }
}

export class PostalOperatorLimitError extends Error {
  readonly code = 'OPERATOR_LIMIT_REACHED'
  readonly maxOperators: number
  readonly currentPlan: string
  constructor(maxOperators: number, currentPlan: string, message: string) {
    super(message)
    this.name = 'PostalOperatorLimitError'
    this.maxOperators = maxOperators
    this.currentPlan = currentPlan
  }
}

export class ConnectionInvalidError extends Error {
  readonly code = 'CONNECTION_INVALID'
  constructor() {
    super('Connection is invalid — please reconnect')
    this.name = 'ConnectionInvalidError'
  }
}

export class OperatorUnavailableError extends Error {
  readonly code = 'OPERATOR_UNAVAILABLE'
  constructor() {
    super('Postal operator is temporarily unavailable')
    this.name = 'OperatorUnavailableError'
  }
}

const QUERY_KEY = ['postal-connections'] as const

export function usePostalConnectionsQuery() {
  return useQuery<PostalConnectionsResponse>({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const res = await apiClient.get<PostalConnectionsResponse>(API_ROUTES.postalConnections.list)
      if (res.status < 200 || res.status >= 300) {
        throw new PostalConnectionError(res.status, parseError(res.data))
      }
      return res.data
    },
  })
}

export function useRequestNovaPostKey() {
  return useMutation({
    mutationFn: async (body: { phone: string }) => {
      const res = await apiClient.post<{ apiKey: string }>(
        API_ROUTES.novaPost.requestKey,
        body,
        { validateStatus: () => true },
      )
      if (res.status >= 200 && res.status < 300) return res.data
      throw new PostalConnectionError(res.status, parseError(res.data))
    },
  })
}

export function useConnectNovaPoshta() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: { apiKey: string }) => {
      const res = await apiClient.post<{ connected: boolean }>(
        API_ROUTES.postalConnections.create,
        body,
        { params: { operator: 'nova-post' }, validateStatus: () => true },
      )
      if (res.status >= 200 && res.status < 300) return res.data

      const data = res.data as unknown as ApiErrorResponse
      if (res.status === 403 && data?.code === 'OPERATOR_LIMIT_REACHED') {
        const meta = data.details?.meta ?? {}
        throw new PostalOperatorLimitError(
          (meta.maxOperators as number) ?? 0,
          (meta.currentPlan as string) ?? '',
          data.message ?? 'Upgrade your plan to connect more operators',
        )
      }
      throw new PostalConnectionError(res.status, parseError(res.data))
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export function useUpdateNovaPoshtaKey() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, apiKey }: { id: number; apiKey: string }) => {
      const res = await apiClient.put<PostalConnectionsResponse>(
        API_ROUTES.postalConnections.update(id),
        { apiKey },
        { validateStatus: () => true },
      )
      if (res.status >= 200 && res.status < 300) return res.data
      if (res.status === 404) throw new ConnectionNotFoundError()
      throw new PostalConnectionError(res.status, parseError(res.data))
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export function useDisconnectNovaPoshta() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient.delete(
        API_ROUTES.postalConnections.delete(id),
        { validateStatus: () => true },
      )
      if (res.status === 204) return
      if (res.status === 404) throw new ConnectionNotFoundError()
      throw new PostalConnectionError(res.status, parseError(res.data))
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export function useConnectUkrposhta() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: { apiKey: string }) => {
      const res = await apiClient.post(
        API_ROUTES.postalConnections.create,
        body,
        { params: { operator: 'ukrposhta' }, validateStatus: () => true },
      )
      if (res.status >= 200 && res.status < 300) return res.data

      const data = res.data as unknown as ApiErrorResponse
      if (res.status === 409 && data?.code === 'CONNECTION_ALREADY_EXISTS') throw new ConnectionAlreadyExistsError()
      if (res.status === 403 && data?.code === 'OPERATOR_LIMIT_REACHED') {
        const meta = data.details?.meta ?? {}
        throw new PostalOperatorLimitError(
          (meta.maxOperators as number) ?? 0,
          (meta.currentPlan as string) ?? '',
          data.message ?? 'Upgrade your plan to connect more operators',
        )
      }
      throw new PostalConnectionError(res.status, parseError(res.data))
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export function useUpdateUkrposhtaKey() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, apiKey }: { id: number; apiKey: string }) => {
      const res = await apiClient.put(
        API_ROUTES.postalConnections.update(id),
        { apiKey },
        { validateStatus: () => true },
      )
      if (res.status >= 200 && res.status < 300) return res.data
      if (res.status === 404) throw new ConnectionNotFoundError()
      throw new PostalConnectionError(res.status, parseError(res.data))
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export function useDisconnectUkrposhta() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient.delete(
        API_ROUTES.postalConnections.delete(id),
        { validateStatus: () => true },
      )
      if (res.status === 204) return
      if (res.status === 404) throw new ConnectionNotFoundError()
      throw new PostalConnectionError(res.status, parseError(res.data))
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export function useConnectMeest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: { apiKey: string }) => {
      const res = await apiClient.post(
        API_ROUTES.postalConnections.create,
        body,
        { params: { operator: 'meest' }, validateStatus: () => true },
      )
      if (res.status >= 200 && res.status < 300) return res.data

      const data = res.data as unknown as ApiErrorResponse
      if (res.status === 409 && data?.code === 'CONNECTION_ALREADY_EXISTS') throw new ConnectionAlreadyExistsError()
      if (res.status === 403 && data?.code === 'OPERATOR_LIMIT_REACHED') {
        const meta = data.details?.meta ?? {}
        throw new PostalOperatorLimitError(
          (meta.maxOperators as number) ?? 0,
          (meta.currentPlan as string) ?? '',
          data.message ?? 'Upgrade your plan to connect more operators',
        )
      }
      throw new PostalConnectionError(res.status, parseError(res.data))
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export function useUpdateMeestKey() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, apiKey }: { id: number; apiKey: string }) => {
      const res = await apiClient.put(
        API_ROUTES.postalConnections.update(id),
        { apiKey },
        { validateStatus: () => true },
      )
      if (res.status >= 200 && res.status < 300) return res.data
      if (res.status === 404) throw new ConnectionNotFoundError()
      throw new PostalConnectionError(res.status, parseError(res.data))
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export function useDisconnectMeest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient.delete(
        API_ROUTES.postalConnections.delete(id),
        { validateStatus: () => true },
      )
      if (res.status === 204) return
      if (res.status === 404) throw new ConnectionNotFoundError()
      throw new PostalConnectionError(res.status, parseError(res.data))
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  })
}

export interface DivisionsQueryParams {
  countryCode?: string
  divisionCategory?: string
  settlementId?: string
  page?: number
  limit?: number
}

export function useNovaPoshtataDivisionsQuery(params?: DivisionsQueryParams) {
  return useQuery<NovaPoshtataDivisionsResponse>({
    queryKey: ['nova-poshta-divisions', params] as const,
    queryFn: async () => {
      const res = await apiClient.get<NovaPoshtataDivisionsResponse>(
        API_ROUTES.postalConnections.novaPostDivisions,
        { params, validateStatus: () => true },
      )
      if (res.status >= 200 && res.status < 300) return res.data
      const code = (res.data as unknown as { code?: string })?.code
      if (res.status === 404 && code === 'CONNECTION_NOT_FOUND') throw new ConnectionNotFoundError()
      if (res.status === 422 && code === 'CONNECTION_INVALID') throw new ConnectionInvalidError()
      if (res.status === 503 && code === 'OPERATOR_UNAVAILABLE') throw new OperatorUnavailableError()
      throw new PostalConnectionError(res.status, parseError(res.data))
    },
    enabled: false,
  })
}
