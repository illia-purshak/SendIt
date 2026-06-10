import { useMutation } from '@tanstack/react-query'
import { apiClient, parseError } from '@/api/apiClient'
import { API_ROUTES } from '@/constants/api-routes'
import type { ApiErrorResponse } from '@/types/api-error'

export class ApiError extends Error {
  readonly status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export class OperatorLimitError extends Error {
  readonly code = 'OPERATOR_LIMIT_REACHED'
  readonly maxOperators: number
  readonly currentPlan: string
  constructor(maxOperators: number, currentPlan: string, message: string) {
    super(message)
    this.name = 'OperatorLimitError'
    this.maxOperators = maxOperators
    this.currentPlan = currentPlan
  }
}

export function useConnectNovaPostMutation() {
  return useMutation({
    mutationFn: async (body: { phone?: string; apiKey?: string }) => {
      const res = await apiClient.post<{ connected: boolean }>(
        API_ROUTES.postalConnections.create,
        body,
        { params: { operator: 'nova-post' }, validateStatus: () => true },
      )

      if (res.status >= 200 && res.status < 300) return res.data

      if (res.status === 403 && (res.data as unknown as ApiErrorResponse)?.code === 'OPERATOR_LIMIT_REACHED') {
        const d = res.data as unknown as ApiErrorResponse
        const meta = d.details?.meta ?? {}
        throw new OperatorLimitError(
          (meta.maxOperators as number) ?? 0,
          (meta.currentPlan as string) ?? '',
          d.message ?? 'Upgrade your plan to connect more operators',
        )
      }

      throw new ApiError(res.status, parseError(res.data))
    },
  })
}
