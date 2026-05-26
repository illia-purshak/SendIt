export interface AdminStatisticsSummary {
  totalUsers: number
  activePaidSubscriptions: number
  totalConnectedPostalOperators: number
  openSupportTickets: number
}

export interface AdminPostalOperatorStatistics {
  id: number | null
  code: string
  displayName: string
  connectedUsers: number
  connectedUsersPercent: number
  responseTimeMs: number | null
  status: string | null
}

export interface AdminStatisticsResponse {
  summary: AdminStatisticsSummary
  postalOperators: AdminPostalOperatorStatistics[]
}
