import type { PaginatedResponse } from '@/types/pagination'

export type ShipmentType = 'DOCUMENT' | 'PACKAGE' | 'BOX' | 'CARGO' | 'PALLET' | 'UNKNOWN'

export interface TemplatePostalService {
  id: number
  name: string
  slug: string
  logoUrl: string | null
}

export interface Template {
  id: number
  name: string
  description: string | null
  shipmentType: ShipmentType
  usageCount: number
  createdAt: string
  updatedAt: string
  postalService: TemplatePostalService
  templateData?: Record<string, unknown>
}

export type TemplatesResponse = PaginatedResponse<Template>

export interface TemplateBody {
  name: string
  description?: string | null
  postalServiceId: number
  shipmentType: ShipmentType
  templateData: Record<string, unknown>
}

export interface TemplateQueryParams {
  operator?: string
  shipmentType?: ShipmentType
  search?: string
  sortBy?: 'createdAt' | 'name'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}
