export type SubscriptionStatus = 'ACTIVE' | 'PAUSED' | 'QUEUED' | 'EXPIRED'
export type SubscriptionPeriodType = 'MONTHLY' | 'YEARLY'
export type DiscountType = 'ONE_TIME' | 'PERMANENT'

export interface CurrentPlan {
  name: string
  level: number
  hasAnalytics: boolean
  hasTemplates: boolean
  hasRecipients: boolean
  maxOperators: number
}

export interface ScheduledPlan {
  name: string
  activatesAt: string
}

export interface SubscriptionPlan {
  id: number
  name: string
  level: number
  price: number
  priceYearly: number | null
  maxOperators: number
  hasAnalytics: boolean
  hasTemplates: boolean
  hasRecipients: boolean
  hasSupport: boolean
  autoRenewDefault: boolean
  isPublic: boolean
  isPersonal: boolean
}

export interface UserSubscriptionBalance {
  id: number
  userId: number
  planId: number
  periodType: SubscriptionPeriodType
  daysTotal: number
  periodEnd: string
  pausedAt: string | null
  status: SubscriptionStatus
  autoRenew: boolean
  position: number
  scheduledSwitchTo: number | null
  scheduledSwitchAt: string | null
  customAmount: number | null
  discountType: DiscountType | null
  createdAt: string
  updatedAt: string
  plan: SubscriptionPlan
}

export interface BillingRecord {
  id: number
  plan: { level: number; name: string }
  amount: string
  status: 'PAID' | 'FAILED' | 'REFUNDED'
  periodStart: string
  periodEnd: string
  paidAt: string | null
}

export interface PaymentCard {
  lastFour: string
  maskedNumber: string
  expiryMonth: number
  expiryYear: number
}

export interface AdminBillingRecord {
  id: number
  userId: number
  planId: number
  balanceId: number
  periodType: SubscriptionPeriodType
  amount: number
  status: string
  periodStart: string
  periodEnd: string
  paidAt: string | null
  createdAt: string
  plan: SubscriptionPlan
}

export interface AdminBillingHistoryResponse {
  data: AdminBillingRecord[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface OnboardingChecklist {
  profileCompleted: boolean
  operatorConnected: boolean
  firstShipmentCreated: boolean
}
