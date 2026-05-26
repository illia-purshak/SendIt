import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient, parseError } from '@/api/apiClient'
import { adminApiClient, parseAdminError } from '@/api/adminApiClient'
import { API_ROUTES } from '@/constants/api-routes'
import { CURRENT_PLAN_QUERY_KEY } from '@/api/auth'
import type { PaginatedResponse } from '@/types/pagination'
import type {
  SubscriptionPlan,
  SubscriptionStatus,
  SubscriptionPeriodType,
  UserSubscriptionBalance,
  DiscountType,
} from '@/types/subscription'

export class SubscriptionError extends Error {
  readonly status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

// ── Client queries ───────────────────────────────────────────────────────────

export function useSubscriptionPlansQuery() {
  return useQuery<SubscriptionPlan[]>({
    queryKey: ['subscription', 'plans'],
    queryFn: async () => {
      const res = await apiClient.get<SubscriptionPlan[]>(API_ROUTES.subscriptions.plans)
      if (res.status < 200 || res.status >= 300) {
        throw new SubscriptionError(res.status, parseError(res.data))
      }
      return res.data
    },
  })
}

export function useMySubscriptionQuery() {
  return useQuery<UserSubscriptionBalance[]>({
    queryKey: ['subscription', 'me'],
    queryFn: async () => {
      const res = await apiClient.get<UserSubscriptionBalance[]>(API_ROUTES.subscriptions.me)
      if (res.status < 200 || res.status >= 300) {
        throw new SubscriptionError(res.status, parseError(res.data))
      }
      return res.data
    },
  })
}

// ── Client mutations ─────────────────────────────────────────────────────────

function invalidateSubscriptionQueries(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['subscription', 'me'] })
  qc.invalidateQueries({ queryKey: CURRENT_PLAN_QUERY_KEY })
  qc.invalidateQueries({ queryKey: ['notifications', 'unread-count'] })
}

export function useBuySubscriptionMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: { planId: number; periodType: SubscriptionPeriodType; activateNow?: boolean }) => {
      const res = await apiClient.post<UserSubscriptionBalance>(
        API_ROUTES.subscriptions.buy,
        body,
        { validateStatus: () => true },
      )
      if (res.status >= 200 && res.status < 300) return res.data
      throw new SubscriptionError(res.status, parseError(res.data))
    },
    onSuccess: () => invalidateSubscriptionQueries(qc),
  })
}

export function useUpdateSubscriptionMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      ...body
    }: { id: number; autoRenew?: boolean; scheduledSwitchTo?: number; cancelSwitch?: boolean }) => {
      const res = await apiClient.put<UserSubscriptionBalance>(
        API_ROUTES.subscriptions.detail(id),
        body,
        { validateStatus: () => true },
      )
      if (res.status >= 200 && res.status < 300) return res.data
      throw new SubscriptionError(res.status, parseError(res.data))
    },
    onSuccess: () => invalidateSubscriptionQueries(qc),
  })
}

export function useCancelSubscriptionMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient.delete(
        API_ROUTES.subscriptions.detail(id),
        { validateStatus: () => true },
      )
      if (res.status >= 200 && res.status < 300) return
      throw new SubscriptionError(res.status, parseError(res.data))
    },
    onSuccess: () => invalidateSubscriptionQueries(qc),
  })
}

// ── Admin queries ────────────────────────────────────────────────────────────

interface AdminSubscriptionsParams {
  plan?: number | ''
  status?: SubscriptionStatus | ''
  search?: string
  page?: number
  limit?: number
}

type AdminSubscriptionsResponse = PaginatedResponse<AdminSubscriptionRow>

export interface AdminSubscriptionRow {
  id: number
  userId: number
  companyName: string
  plan: SubscriptionPlan
  status: SubscriptionStatus
  periodEnd: string
  autoRenew: boolean
  position: number
  customAmount: string | null
  discountType: DiscountType | null
}

export function useAdminSubscriptionsQuery(params: AdminSubscriptionsParams) {
  return useQuery<AdminSubscriptionsResponse>({
    queryKey: ['admin', 'subscriptions', params],
    queryFn: async () => {
      const res = await adminApiClient.get<AdminSubscriptionsResponse>(API_ROUTES.adminSubscriptions.list, {
        params: {
          ...(params.plan !== undefined && params.plan !== '' ? { plan: params.plan } : {}),
          ...(params.status ? { status: params.status } : {}),
          ...(params.search ? { search: params.search } : {}),
          page: params.page ?? 1,
          limit: params.limit ?? 20,
        },
      })
      if (res.status < 200 || res.status >= 300) {
        throw new SubscriptionError(res.status, parseAdminError(res.data))
      }
      return res.data
    },
  })
}

// ── Admin mutations ──────────────────────────────────────────────────────────

export type AdminSubscriptionAction =
  | { action: 'changePlan'; planId: number }
  | { action: 'extend'; days: number }
  | { action: 'cancel' }
  | { action: 'setDiscount'; amount: number; discountType: DiscountType }

export function useAdminUpdateSubscriptionMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...body }: AdminSubscriptionAction & { id: number }) => {
      const res = await adminApiClient.put(API_ROUTES.adminSubscriptions.update(id), body)
      if (res.status < 200 || res.status >= 300) {
        throw new SubscriptionError(res.status, parseAdminError(res.data))
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'subscriptions'] }),
  })
}

// ── Admin plan CRUD ──────────────────────────────────────────────────────────

interface AdminPlansParams {
  isPersonal?: boolean
  isPublic?: boolean
  page?: number
  limit?: number
}

type AdminPlansResponse = PaginatedResponse<SubscriptionPlan>

export function useAdminPlansQuery(params: AdminPlansParams = {}) {
  return useQuery<AdminPlansResponse>({
    queryKey: ['admin', 'plans', params],
    queryFn: async () => {
      const res = await adminApiClient.get<AdminPlansResponse>(API_ROUTES.adminPlans.list, {
        params: {
          ...(params.isPersonal !== undefined ? { isPersonal: params.isPersonal } : {}),
          ...(params.isPublic !== undefined ? { isPublic: params.isPublic } : {}),
          page: params.page ?? 1,
          limit: params.limit ?? 20,
        },
      })
      if (res.status < 200 || res.status >= 300) {
        throw new SubscriptionError(res.status, parseAdminError(res.data))
      }
      return res.data
    },
  })
}

export type AdminPlanBody = {
  name: string
  level: number
  price: string
  priceYearly?: string | null
  maxOperators: number
  hasAnalytics: boolean
  hasTemplates: boolean
  hasRecipients: boolean
  hasSupport: boolean
  autoRenewDefault: boolean
  isPublic: boolean
  isPersonal: boolean
  targetUserId?: number | null
}

export function useAdminCreatePlanMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: AdminPlanBody) => {
      const res = await adminApiClient.post<SubscriptionPlan>(API_ROUTES.adminPlans.list, body)
      if (res.status < 200 || res.status >= 300) {
        throw new SubscriptionError(res.status, parseAdminError(res.data))
      }
      return res.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'plans'] }),
  })
}

export function useAdminUpdatePlanMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...body }: Partial<AdminPlanBody> & { id: number }) => {
      const res = await adminApiClient.put<SubscriptionPlan>(API_ROUTES.adminPlans.detail(id), body)
      if (res.status < 200 || res.status >= 300) {
        throw new SubscriptionError(res.status, parseAdminError(res.data))
      }
      return res.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'plans'] }),
  })
}

export function useAdminDeletePlanMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await adminApiClient.delete(API_ROUTES.adminPlans.detail(id))
      if (res.status < 200 || res.status >= 300) {
        throw new SubscriptionError(res.status, parseAdminError(res.data))
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'plans'] }),
  })
}
