import { createContext } from 'react'
import type { User, CompleteOrganizationProfileBody } from '@/types/auth'

export type LoginResult = null | { requires2FA: true } | { requiresProfileCompletion: true } | string

export interface AuthContextValue {
  user: User | null
  loading: boolean
  login(email: string, password: string): Promise<LoginResult>
  verify2fa(pendingToken: string, totpCode: string): Promise<string | null>
  register(email: string, password: string): Promise<string | null>
  logout(): void
  completeOrganizationProfile(body: CompleteOrganizationProfileBody): Promise<string | null>
  forgotPassword(email: string): Promise<string | null>
  resetPassword(token: string, password: string): Promise<string | null>
  setup2fa(): Promise<{ qrCodeUrl: string; secret: string } | string>
  enable2fa(totpCode: string): Promise<string | null>
  disable2fa(totpCode: string): Promise<string | null>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
