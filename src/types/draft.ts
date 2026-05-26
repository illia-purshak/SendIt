import type { PaginatedResponse } from '@/types/pagination'

export interface Draft {
  id: number
  userId: number
  postalServiceId: number | null
  draftData: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export type DraftsResponse = PaginatedResponse<Draft>

export interface DraftBody {
  postalServiceId?: number | null
  draftData?: Record<string, unknown>
}
