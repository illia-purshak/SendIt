import { useQuery } from '@tanstack/react-query'
import { apiClient, parseError } from '@/api/apiClient'
import { API_ROUTES } from '@/constants/api-routes'
import type { OnboardingChecklist } from '@/types/subscription'

class OnboardingError extends Error {
  readonly status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export function useOnboardingChecklistQuery() {
  return useQuery<OnboardingChecklist>({
    queryKey: ['onboarding', 'checklist'],
    queryFn: async () => {
      const res = await apiClient.get<OnboardingChecklist>(API_ROUTES.onboarding.checklist)
      if (res.status < 200 || res.status >= 300) {
        throw new OnboardingError(res.status, parseError(res.data))
      }
      return res.data
    },
  })
}
