export type PayerType = 'SENDER' | 'RECEIVER' | 'THIRD_PARTY'
export type ParcelItemType = 'DOCUMENT' | 'PACKAGE' | 'BOX'

// ─── Discriminated item variants (include id for responses) ───────────────────

export interface DocumentParcelItem {
  id?: number
  type: 'DOCUMENT'
  documentType: string
  weight?: number
  declaredValue?: number
  description?: string
}

export interface PackageParcelItem {
  id?: number
  type: 'PACKAGE'
  declaredValue: number
  weight?: number
  height?: number
  width?: number
  length?: number
  description?: string
}

export interface BoxParcelItem {
  id?: number
  type: 'BOX'
  declaredValue: number
  weight?: number
  height: number
  width: number
  length: number
  description: string
}

export type ParcelItem = DocumentParcelItem | PackageParcelItem | BoxParcelItem

// ─── Payload variants (no id, sent to API) ────────────────────────────────────

export type DocumentParcelItemPayload = Omit<DocumentParcelItem, 'id'>
export type PackageParcelItemPayload = Omit<PackageParcelItem, 'id'>
export type BoxParcelItemPayload = Omit<BoxParcelItem, 'id'>
export type ParcelItemPayload =
  | DocumentParcelItemPayload
  | PackageParcelItemPayload
  | BoxParcelItemPayload

// ─── Template ─────────────────────────────────────────────────────────────────

export interface ParcelTemplate {
  id: number
  name: string
  description?: string
  senderName: string
  senderPhone: string
  senderAddress: string
  senderCity: string
  recipientName: string
  recipientPhone: string
  recipientAddress: string
  recipientCity: string
  payerType: PayerType
  isDefault: boolean
  parcelItems: ParcelItem[]
  createdAt: string
  updatedAt: string
}

export interface ParcelTemplateBody {
  name: string
  description?: string
  senderName: string
  senderPhone: string
  senderAddress: string
  senderCity: string
  recipientName: string
  recipientPhone: string
  recipientAddress: string
  recipientCity: string
  payerType: PayerType
  isDefault?: boolean
  parcelItems: ParcelItemPayload[]
}
