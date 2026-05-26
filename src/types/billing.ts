import type { BillingRecord } from '@/types/subscription'
import type { PaginatedResponse } from '@/types/pagination'

export type BillingHistoryResponse = PaginatedResponse<BillingRecord>
