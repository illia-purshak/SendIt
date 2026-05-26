import { useQuery } from '@tanstack/react-query'
import { adminApiClient, parseAdminError } from '@/api/adminApiClient'
import { API_ROUTES } from '@/constants/api-routes'
import type { AdminStatisticsResponse } from '@/types/admin-statistics'

class AdminStatisticsError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'AdminStatisticsError'
    this.status = status
  }
}

const STATS_KEY = ['admin', 'statistics'] as const

export function useAdminStatisticsQuery() {
  return useQuery<AdminStatisticsResponse>({
    queryKey: STATS_KEY,
    queryFn: async () => {
      const res = await adminApiClient.get<AdminStatisticsResponse>(API_ROUTES.adminStatistics.summary)
      if (res.status >= 200 && res.status < 300) return res.data
      throw new AdminStatisticsError(res.status, parseAdminError(res.data))
    },
  })
}
