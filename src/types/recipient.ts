import type { PaginatedResponse } from '@/types/pagination'

export type RecipientType = 'INDIVIDUAL' | 'ORGANIZATION'
export type RecipientAddressType = 'BRANCH' | 'STREET'

export interface RecipientAddress {
  type: RecipientAddressType
  city: string
  branchNumber?: string
  street?: string
  building?: string
  flat?: string
  postCode?: string
}

export interface Recipient {
  id: number
  type: RecipientType
  firstName: string | null
  lastName: string | null
  patronymic: string | null
  phone: string
  email: string | null
  companyName: string | null
  ownershipForm: string | null
  edrpou: string | null
  note: string | null
  address: RecipientAddress | null
  createdAt: string
  updatedAt: string
}

export type RecipientsResponse = PaginatedResponse<Recipient>

export interface RecipientBody {
  type: RecipientType
  firstName?: string | null
  lastName?: string | null
  patronymic?: string | null
  phone: string
  email?: string | null
  note?: string | null
  companyName?: string | null
  ownershipForm?: string | null
  edrpou?: string | null
  address?: RecipientAddress | null
}

export interface RecipientQueryParams {
  type?: RecipientType
  search?: string
  sortBy?: 'createdAt' | 'lastName' | 'companyName'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}
