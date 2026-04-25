import { createContext, useContext, type ReactNode } from 'react'
import type {
  User,
  RegisterBody,
  CompleteIndividualProfileBody,
  CompleteOrganizationProfileBody,
} from '@/types/auth'
import {
  useSessionQuery,
  useLoginMutation,
  useRegisterMutation,
  useLogout,
  useCompleteIndividualProfileMutation,
  useCompleteOrganizationProfileMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
} from '@/api/auth'

interface AuthContextValue {
  user: User | null
  loading: boolean
  login(email: string, password: string): Promise<string | null>
  register(body: RegisterBody): Promise<string | null>
  logout(): void
  completeIndividualProfile(body: CompleteIndividualProfileBody): Promise<string | null>
  completeOrganizationProfile(body: CompleteOrganizationProfileBody): Promise<string | null>
  forgotPassword(email: string): Promise<string | null>
  resetPassword(token: string, password: string): Promise<string | null>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const sessionQuery = useSessionQuery()
  const loginMutation = useLoginMutation()
  const registerMutation = useRegisterMutation()
  const logout = useLogout()
  const completeIndividualProfileMutation = useCompleteIndividualProfileMutation()
  const completeOrganizationProfileMutation = useCompleteOrganizationProfileMutation()
  const forgotPasswordMutation = useForgotPasswordMutation()
  const resetPasswordMutation = useResetPasswordMutation()

  const value: AuthContextValue = {
    user: sessionQuery.data ?? null,
    loading: sessionQuery.isPending,
    async login(email, password) {
      try {
        await loginMutation.mutateAsync({ email, password })
        return null
      } catch (error) {
        return error instanceof Error ? error.message : 'An unexpected error occurred'
      }
    },
    async register(body) {
      try {
        await registerMutation.mutateAsync(body)
        return null
      } catch (error) {
        return error instanceof Error ? error.message : 'An unexpected error occurred'
      }
    },
    logout,
    async completeIndividualProfile(body) {
      try {
        await completeIndividualProfileMutation.mutateAsync(body)
        return null
      } catch (error) {
        return error instanceof Error ? error.message : 'An unexpected error occurred'
      }
    },
    async completeOrganizationProfile(body) {
      try {
        await completeOrganizationProfileMutation.mutateAsync(body)
        return null
      } catch (error) {
        return error instanceof Error ? error.message : 'An unexpected error occurred'
      }
    },
    async forgotPassword(email) {
      try {
        await forgotPasswordMutation.mutateAsync(email)
        return null
      } catch (error) {
        return error instanceof Error ? error.message : 'An unexpected error occurred'
      }
    },
    async resetPassword(token, password) {
      try {
        await resetPasswordMutation.mutateAsync({ token, password })
        return null
      } catch (error) {
        return error instanceof Error ? error.message : 'An unexpected error occurred'
      }
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be inside AuthProvider')
  return ctx
}
