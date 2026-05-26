import type { CurrentPlan, ScheduledPlan } from '@/types/subscription'

const REFRESH_KEY = 'sendit.refreshToken'
const PENDING_KEY = 'sendit.pendingToken'
const SETUP_KEY = 'sendit.profileSetupToken'

let _accessToken: string | null = null
let _currentPlan: CurrentPlan | null = null
let _scheduledPlan: ScheduledPlan | null = null

export const authStore = {
  getToken: (): string | null => _accessToken,
  setTokens: (access: string, refresh: string): void => {
    _accessToken = access
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(REFRESH_KEY, refresh)
    }
  },
  getRefreshToken: (): string | null => {
    if (typeof window === 'undefined') return null
    return window.localStorage.getItem(REFRESH_KEY)
  },
  setCurrentPlan: (plan: CurrentPlan | null, scheduled: ScheduledPlan | null = null): void => {
    _currentPlan = plan
    _scheduledPlan = scheduled
  },
  getCurrentPlan: (): CurrentPlan | null => _currentPlan,
  getScheduledPlan: (): ScheduledPlan | null => _scheduledPlan,
  setPendingToken: (token: string): void => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(PENDING_KEY, token)
    }
  },
  getPendingToken: (): string | null => {
    if (typeof window === 'undefined') return null
    return window.sessionStorage.getItem(PENDING_KEY)
  },
  clearPendingToken: (): void => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(PENDING_KEY)
    }
  },
  setProfileSetupToken: (token: string): void => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(SETUP_KEY, token)
    }
  },
  getProfileSetupToken: (): string | null => {
    if (typeof window === 'undefined') return null
    return window.sessionStorage.getItem(SETUP_KEY)
  },
  clearProfileSetupToken: (): void => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(SETUP_KEY)
    }
  },
  clear: (): void => {
    _accessToken = null
    _currentPlan = null
    _scheduledPlan = null
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(REFRESH_KEY)
      window.sessionStorage.removeItem(PENDING_KEY)
      window.sessionStorage.removeItem(SETUP_KEY)
    }
  },
}
