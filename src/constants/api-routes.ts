export const API_ROUTES = {
  auth: {
    me: '/auth/me',
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
    completeProfile: {
      individual: '/auth/complete-profile/individual',
      organization: '/auth/complete-profile/organization',
    },
  },
} as const
