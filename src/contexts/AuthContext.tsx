import type { ReactNode } from "react";
import {
  useSessionQuery,
  useLoginMutation,
  useVerify2faMutation,
  useRegisterMutation,
  useLogout,
  useCompleteOrganizationProfileMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useSetup2faMutation,
  useEnable2faMutation,
  useDisable2faMutation,
} from "@/api/auth";
import { AuthContext, type AuthContextValue } from "./auth-context";

export function AuthProvider({ children }: { children: ReactNode }) {
  const sessionQuery = useSessionQuery();
  const loginMutation = useLoginMutation();
  const verify2faMutation = useVerify2faMutation();
  const registerMutation = useRegisterMutation();
  const logout = useLogout();
  const completeOrganizationProfileMutation =
    useCompleteOrganizationProfileMutation();
  const forgotPasswordMutation = useForgotPasswordMutation();
  const resetPasswordMutation = useResetPasswordMutation();
  const setup2faMutation = useSetup2faMutation();
  const enable2faMutation = useEnable2faMutation();
  const disable2faMutation = useDisable2faMutation();

  const value: AuthContextValue = {
    user: sessionQuery.data ?? null,
    loading: sessionQuery.isPending,

    async login(email, password) {
      try {
        const result = await loginMutation.mutateAsync({ email, password });
        if ("requires2FA" in result) return { requires2FA: true };
        if ("requiresProfileCompletion" in result)
          return { requiresProfileCompletion: true };
        return null;
      } catch (error) {
        return error instanceof Error
          ? error.message
          : "An unexpected error occurred";
      }
    },

    async verify2fa(pendingToken, totpCode) {
      try {
        await verify2faMutation.mutateAsync({ pendingToken, totpCode });
        return null;
      } catch (error) {
        return error instanceof Error
          ? error.message
          : "An unexpected error occurred";
      }
    },

    async register(email, password) {
      try {
        await registerMutation.mutateAsync({ email, password });
        return null;
      } catch (error) {
        return error instanceof Error
          ? error.message
          : "An unexpected error occurred";
      }
    },

    logout,

    async completeOrganizationProfile(body) {
      try {
        await completeOrganizationProfileMutation.mutateAsync(body);
        return null;
      } catch (error) {
        return error instanceof Error
          ? error.message
          : "An unexpected error occurred";
      }
    },

    async forgotPassword(email) {
      try {
        await forgotPasswordMutation.mutateAsync(email);
        return null;
      } catch (error) {
        return error instanceof Error
          ? error.message
          : "An unexpected error occurred";
      }
    },

    async resetPassword(token, password) {
      try {
        await resetPasswordMutation.mutateAsync({ token, password });
        return null;
      } catch (error) {
        return error instanceof Error
          ? error.message
          : "An unexpected error occurred";
      }
    },

    async setup2fa() {
      try {
        return await setup2faMutation.mutateAsync();
      } catch (error) {
        return error instanceof Error
          ? error.message
          : "An unexpected error occurred";
      }
    },

    async enable2fa(totpCode) {
      try {
        await enable2faMutation.mutateAsync(totpCode);
        return null;
      } catch (error) {
        return error instanceof Error
          ? error.message
          : "An unexpected error occurred";
      }
    },

    async disable2fa(totpCode) {
      try {
        await disable2faMutation.mutateAsync(totpCode);
        return null;
      } catch (error) {
        return error instanceof Error
          ? error.message
          : "An unexpected error occurred";
      }
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
