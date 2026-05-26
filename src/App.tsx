import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'
import { APP_ROUTES } from '@/constants/app-routes'
import { AuthProvider } from '@/contexts/AuthContext'
import { useAuthContext } from '@/contexts/useAuthContext'
import { adminTokenStore } from '@/store/adminTokenStore'
import { authStore } from '@/store/authStore'
import UiKitRoute from '@/routes/ui-kit'
import DataTableExampleRoute from '@/routes/data-table-example'
import LoginRoute from '@/routes/login'
import RegisterRoute from '@/routes/register'
import ForgotPasswordRoute from '@/routes/forgot-password'
import ResetPasswordRoute from '@/routes/reset-password'
import Verify2faRoute from '@/routes/verify-2fa'
import CompleteProfileRoute from '@/routes/complete-profile'
import DashboardRoute from '@/routes/dashboard'
import ShipmentsRoute from '@/routes/shipments'
import ShipmentDetailRoute from '@/routes/shipment-detail'
import ShipmentNewRoute from '@/routes/shipment-new'
import TemplatesRoute from '@/routes/templates'
import TemplateFormRoute from '@/routes/template-form'
import RecipientsRoute from '@/routes/recipients'
import AnalyticsRoute from '@/routes/analytics'
import BillingRoute from '@/routes/billing'
import NotificationsRoute from '@/routes/notifications'
import SupportRoute from '@/routes/support'
import SettingsRoute from '@/routes/settings'
import NovaPostConnectRoute from '@/routes/nova-post-connect'
import ProfileRoute from '@/routes/profile/ProfileRoute'
import AdminLoginRoute from '@/routes/admin/login'
import AdminVerify2faRoute from '@/routes/admin/verify-2fa'
import AdminAcceptInviteRoute from '@/routes/admin/accept-invite'
import AdminSetup2faRoute from '@/routes/admin/setup-2fa'
import AdminDashboardRoute from '@/routes/admin/dashboard'
import AdminUsersRoute from '@/routes/admin/users'
import AdminUserDetailRoute from '@/routes/admin/user-detail'
import AdminSubscriptionsRoute from '@/routes/admin/subscriptions'
import AdminPlansRoute from '@/routes/admin/plans'
import AdminSupportRoute from '@/routes/admin/support'
import AdminMySupportRoute from '@/routes/admin/support-my'
import AdminServicesRoute from '@/routes/admin/services'
import AdminBillingRoute from '@/routes/admin/billing'
import AdminSettingsRoute from '@/routes/admin/settings'
import AdminProfileRoute from '@/routes/admin/profile'
import AdminAdminsRoute from '@/routes/admin/admins'
import AdminAcceptInvite2faRoute from '@/routes/admin/accept-invite-2fa'
import { Spinner } from './components/Loader/Spinner'
import { MainLayout } from './layouts/MainLayout'
import { AdminLayout } from './layouts/AdminLayout'

export const RequireAuth = () => {
  const { user, loading } = useAuthContext()
  const location = useLocation()
  if (loading) return <Spinner />
  if (!user) return <Navigate to={APP_ROUTES.login} state={{ from: location }} replace />
  return <Outlet />
}

export const GuestOnly = () => {
  const { user, loading } = useAuthContext()
  if (loading) return <Spinner />
  if (user) return <Navigate to={APP_ROUTES.dashboard} replace />
  return <Outlet />
}

export const RequireProfileSetupToken = () => {
  const { user, loading } = useAuthContext()
  if (loading) return <Spinner />
  if (user) return <Navigate to={APP_ROUTES.dashboard} replace />
  if (!authStore.getProfileSetupToken()) return <Navigate to={APP_ROUTES.login} replace />
  return <Outlet />
}

export const AdminGuestOnly = () => {
  const hasAdminSession = adminTokenStore.hasSession()
  if (hasAdminSession) return <Navigate to={APP_ROUTES.admin.dashboard} replace />
  return <Outlet />
}

export const RequireAdminAuth = () => {
  const hasAdminSession = adminTokenStore.hasSession()
  if (!hasAdminSession) return <Navigate to={APP_ROUTES.admin.login} replace />
  return <Outlet />
}

export const RequireSuperAdminAuth = () => {
  if (!adminTokenStore.hasSession()) return <Navigate to={APP_ROUTES.admin.login} replace />
  if (!adminTokenStore.getIsSuperAdmin()) return <Navigate to={APP_ROUTES.admin.dashboard} replace />
  return <Outlet />
}

function AppRoutes() {
  return (
    <Routes>
      {/* Root redirect */}
      <Route path={APP_ROUTES.root} element={<Navigate to={APP_ROUTES.dashboard} replace />} />

      {/* User guest routes */}
      <Route element={<GuestOnly />}>
        <Route path={APP_ROUTES.login} element={<LoginRoute />} />
        <Route path={APP_ROUTES.register} element={<RegisterRoute />} />
        <Route path={APP_ROUTES.forgotPassword} element={<ForgotPasswordRoute />} />
        <Route path={APP_ROUTES.resetPassword} element={<ResetPasswordRoute />} />
        <Route path={APP_ROUTES.verify2fa} element={<Verify2faRoute />} />
      </Route>

      {/* Public routes */}
      <Route path={APP_ROUTES.uiKit} element={<UiKitRoute />} />
      <Route path={APP_ROUTES.dataTableExample} element={<DataTableExampleRoute />} />

      {/* Profile setup — accessible only with a profileSetupToken, no full auth needed */}
      <Route element={<RequireProfileSetupToken />}>
        <Route path={APP_ROUTES.completeProfile} element={<CompleteProfileRoute />} />
      </Route>

      {/* User protected routes */}
      <Route element={<RequireAuth />}>
        <Route element={<MainLayout />}>
          <Route path={APP_ROUTES.dashboard} element={<DashboardRoute />} />
          <Route path={APP_ROUTES.shipments} element={<ShipmentsRoute />} />
          <Route path={APP_ROUTES.shipmentDetail} element={<ShipmentDetailRoute />} />
          <Route path={APP_ROUTES.newShipment} element={<ShipmentNewRoute />} />
          <Route path={APP_ROUTES.templates} element={<TemplatesRoute />} />
          <Route path={APP_ROUTES.newTemplate} element={<TemplateFormRoute />} />
          <Route path={APP_ROUTES.editTemplate} element={<TemplateFormRoute />} />
          <Route path={APP_ROUTES.recipients} element={<RecipientsRoute />} />
          <Route path={APP_ROUTES.analytics} element={<AnalyticsRoute />} />
          <Route path={APP_ROUTES.billing} element={<BillingRoute />} />
          <Route path={APP_ROUTES.notifications} element={<NotificationsRoute />} />
          <Route path={APP_ROUTES.support} element={<SupportRoute />} />
          <Route path={APP_ROUTES.settings} element={<SettingsRoute />} />
          <Route path={APP_ROUTES.novaPostConnect} element={<NovaPostConnectRoute />} />
          <Route path={APP_ROUTES.profile} element={<ProfileRoute />} />
        </Route>
      </Route>

      {/* Admin guest routes */}
      <Route element={<AdminGuestOnly />}>
        <Route path={APP_ROUTES.admin.login} element={<AdminLoginRoute />} />
        <Route path={APP_ROUTES.admin.verify2fa} element={<AdminVerify2faRoute />} />
      </Route>

      {/* Admin public routes — accessible regardless of admin auth state */}
      <Route path={APP_ROUTES.admin.acceptInvite} element={<AdminAcceptInviteRoute />} />
      <Route path={APP_ROUTES.admin.acceptInvite2fa} element={<AdminAcceptInvite2faRoute />} />
      <Route path={APP_ROUTES.admin.setup2fa} element={<AdminSetup2faRoute />} />

      {/* Admin protected routes */}
      <Route element={<RequireAdminAuth />}>
        <Route element={<AdminLayout />}>
          <Route path={APP_ROUTES.admin.dashboard} element={<AdminDashboardRoute />} />
          <Route path={APP_ROUTES.admin.users} element={<AdminUsersRoute />} />
          <Route path={APP_ROUTES.admin.userDetail} element={<AdminUserDetailRoute />} />
          <Route path={APP_ROUTES.admin.subscriptions} element={<AdminSubscriptionsRoute />} />
          <Route path={APP_ROUTES.admin.plans} element={<AdminPlansRoute />} />
          <Route path={APP_ROUTES.admin.support} element={<AdminSupportRoute />} />
          <Route path={APP_ROUTES.admin.mySupport} element={<AdminMySupportRoute />} />
          <Route path={APP_ROUTES.admin.services} element={<AdminServicesRoute />} />
          <Route path={APP_ROUTES.admin.billing} element={<AdminBillingRoute />} />
          <Route path={APP_ROUTES.admin.settings} element={<AdminSettingsRoute />} />
          <Route path={APP_ROUTES.admin.profile} element={<AdminProfileRoute />} />
          <Route element={<RequireSuperAdminAuth />}>
            <Route path={APP_ROUTES.admin.admins} element={<AdminAdminsRoute />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App
