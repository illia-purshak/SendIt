export type PostalConnectionStatus = 'ACTIVE' | 'BLOCKED' | 'INVALID'

export interface PostalService {
  id: number
  name: string
  slug: string
  logoUrl: string | null
}

export interface PostalConnection {
  id: number
  postalService: PostalService
  status: PostalConnectionStatus
  connectedAt: string
  updatedAt: string
}

export interface PostalConnectionsResponse {
  connections: PostalConnection[]
}

export interface NovaPoshtataDivision {
  id: string
  number: string
  name: string
  address: string
  settlement: { name: string }
  divisionCategory: string
  status: string
}

export interface NovaPoshtataDivisionsResponse {
  data: NovaPoshtataDivision[]
  total: number
}
