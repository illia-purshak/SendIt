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
  parcelTemplates: {
    list: '/parcel-templates',
    detail: (id: number) => `/parcel-templates/${id}`,
    setDefault: (id: number) => `/parcel-templates/${id}/set-default`,
  },
} as const
