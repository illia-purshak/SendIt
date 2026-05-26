export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'CLIENT'

export interface OrganizationProfile {
  userId: number
  companyName: string
  edrpou: string
  legalAddress: string
  companyNameLat: string | null
  ownershipForm: string | null
  taxNumber: string | null
  contactPersonName: string | null
}

export interface ProfileSettings {
  language: string
  timezone: string
  dateFormat: string
}

export interface ProfileNotifications {
  subscription: boolean
  postalConnection: boolean
  account: boolean
  system: boolean
  email: boolean
}

export interface UpdateProfileBody {
  companyName?: string
  phone?: string
  contactPersonName?: string
  companyNameLat?: string
  ownershipForm?: string
  legalAddress?: string
  taxNumber?: string
}

export interface UpdateSettingsBody {
  language?: string
  timezone?: string
  dateFormat?: string
  notifications?: {
    subscription?: boolean
    postalConnection?: boolean
    system?: boolean
    email?: boolean
  }
}

export interface User {
  id: number
  email: string | null
  phone: string | null
  avatarUrl: string | null
  role: UserRole
  profileCompleted: boolean
  status: 'ACTIVE' | 'INACTIVE' | 'BANNED' | 'DELETED'
  createdAt: string
  updatedAt: string
  profile: OrganizationProfile | null
  settings?: ProfileSettings
  notifications?: ProfileNotifications
  twoFactorEnabled?: boolean
}

export interface CompleteOrganizationProfileBody {
  companyName: string
  edrpou: string
  legalAddress: string
  companyNameLat?: string | null
  taxNumber?: string | null
  contactPersonName?: string | null
}

export interface Admin {
  id: number
  email: string
  firstName: string
  lastName: string
  role: 'ADMIN' | 'SUPER_ADMIN'
  status: string
}
