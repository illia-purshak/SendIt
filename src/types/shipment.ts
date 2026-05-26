import type { PaginatedResponse } from '@/types/pagination'

export type ShipmentStatus =
  | 'DRAFT'
  | 'CREATED'
  | 'PREPARING'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURNED'
  | 'UNKNOWN'

export type ShipmentEditableField = string

export interface ShipmentListItem {
  kind: 'shipment' | 'draft'
  operator: string
  draftId: number | null
  ref: string | null
  ttn: string | null
  postalServiceId: number
  operatorName: string
  operatorLogoUrl: string | null
  normalizedStatus: ShipmentStatus
  rawStatus: string | null
  recipientName: string | null
  createdAt: string
  declaredValue: number | null
  canEdit?: boolean
  canCancel?: boolean
  canDuplicate?: boolean
  editableFields?: ShipmentEditableField[] | 'ALL'
}

export type ShipmentsResponse = PaginatedResponse<ShipmentListItem>

export interface TrackingHistoryItem {
  code: string
  codeName: string
  countryCode: string
  settlement: string
  date: string
}

export interface ShipmentDetail extends ShipmentListItem {
  postalServiceName: string
  postalServiceLogoUrl: string | null
  recipientPhone: string | null
  recipientEmail: string | null
  deliveryAddress: string
  weight: number | null
  lastSyncedAt: string | null
  scheduledDeliveryDate: string | null
  trackingHistory: TrackingHistoryItem[]
  metadata: Record<string, unknown>
}

export interface ShipmentPrefillPerson {
  name?: string
  phone?: string
  countryCode?: string
  divisionNumber?: string
  city?: string
  address?: string
  postalCode?: string
}

export interface ShipmentPrefillParcel {
  cargoCategory?: string
  parcelDescription?: string
  insuranceCost?: number
  actualWeight?: number
  dimensions?: {
    length?: number
    width?: number
    height?: number
  }
}

export interface ShipmentPrefillInvoice {
  cost?: number
  currency?: string
}

export interface ShipmentPrefillDetail {
  id?: number
  ttn?: string | null
  operator?: string | { slug?: string; name?: string }
  postalServiceMode?: string
  normalizedStatus?: ShipmentStatus
  rawStatus?: string | null
  payerType?: 'Sender' | 'Recipient' | 'ThirdPerson'
  payerContractNumber?: string
  clientOrder?: string
  note?: string
  deliveryType?: 'standard' | 'economy' | 'express'
  readyToShip?: boolean
  status?: string
  sender?: ShipmentPrefillPerson
  recipient?: ShipmentPrefillPerson
  parcel?: ShipmentPrefillParcel
  parcels?: Array<{
    cargoCategory?: 'parcel' | 'documents' | 'pallet'
    parcelDescription?: string
    insuranceCost?: number
    actualWeight?: number
    width?: number
    length?: number
    height?: number
  }>
  invoice?: ShipmentPrefillInvoice
  recipientName?: string | null
  recipientPhone?: string | null
  deliveryAddress?: string
  weight?: number | null
  statusHistory?: Array<{
    status: string
    rawStatus?: string | null
    timestamp: string
  }>
  createdAt?: string
  metadata?: Record<string, unknown>
}

export interface ShipmentQueryParams {
  operator?: string
  status?: ShipmentStatus
  ttn?: string
  recipient?: string
  createdFrom?: string
  createdTo?: string
  valueFrom?: number
  valueTo?: number
  sortBy?: string
  sortDir?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export interface CreateNovaPoshtaShipmentBody {
  status?: 'ReadyToShip'
  draftId?: number
  clientOrder?: string
  note?: string
  deliveryType?: 'standard' | 'economy' | 'express'
  payerType: 'Sender' | 'Recipient' | 'ThirdPerson'
  payerContractNumber?: string
  sender: {
    name: string
    phone: string
    countryCode: string
    divisionNumber?: string
  }
  recipient: {
    name: string
    phone: string
    countryCode: string
    divisionNumber?: string
  }
  parcels: Array<{
    rowNumber: number
    cargoCategory: 'parcel' | 'documents' | 'pallet'
    parcelDescription: string
    actualWeight: number
    width: number
    length: number
    height: number
    insuranceCost: number
  }>
  invoice?: {
    cost?: number
    currency?: string
  }
}

export interface CreateSimpleShipmentBody {
  sender: { name: string; phone: string }
  recipient: { name: string; phone: string; address: string; city: string }
  weight: number
  declaredValue: number
  description?: string
  draftId?: number
}

export interface CreateSimpleShipmentResponse {
  ttn: string
  normalizedStatus: ShipmentStatus
  declaredValue: number
  weight: number
  createdAt: string
}

export interface CreateShipmentResponse {
  ttn: string
  ref: string
  status: string
  rawStatus: string
  scheduledDeliveryDate: string | null
}
