export type UserType = 'INDIVIDUAL' | 'ORGANIZATION'
export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'OPERATOR' | 'COURIER' | 'CLIENT'

export interface User {
  id: number
  email?: string
  phone?: string | null
  phoneNumber?: string | null
  type: UserType
  role: UserRole
  profileCompleted: boolean
  status?: string
  createdAt?: string
  updatedAt?: string
}

export interface IndividualProfile {
  userId: number
  firstName: string
  middleName?: string | null
  lastName: string
  firstNameLat?: string | null
  lastNameLat?: string | null
  birthDate?: string | null
}

export interface OrganizationProfile {
  userId: number
  companyName: string
  edrpou: string
  legalAddress: string
  companyNameLat?: string | null
  taxNumber?: string | null
  contactPersonName?: string | null
}

export interface RegisterBody {
  email: string
  phone?: string
  type: UserType
  password: string
}

export interface CompleteIndividualProfileBody {
  firstName: string
  lastName: string
  middleName?: string | null
  firstNameLat?: string | null
  lastNameLat?: string | null
  birthDate?: string
}

export interface CompleteOrganizationProfileBody {
  companyName: string
  edrpou: string
  legalAddress: string
  companyNameLat?: string | null
  taxNumber?: string | null
  contactPersonName?: string | null
}
