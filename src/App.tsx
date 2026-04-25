import { Routes, Route, Navigate, useLocation, Outlet } from "react-router-dom";
import { APP_ROUTES } from "@/constants/app-routes";
import { AuthProvider, useAuthContext } from "@/contexts/AuthContext";
import { UiKitPage } from "@/pages/ui-kit";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import ForgotPasswordPage from "@/pages/forgot-password";
import ResetPasswordPage from "@/pages/reset-password";
import CompleteProfilePage from "@/pages/complete-profile";
import HomePage from "@/pages/home";
import { Spinner } from "./components/Loader/Spinner";

export const RequireAuth = () => {
  const { user, loading } = useAuthContext();
  const location = useLocation();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to={APP_ROUTES.login} replace />;
  if (
    !user.profileCompleted &&
    location.pathname !== APP_ROUTES.completeProfile
  )
    return <Navigate to={APP_ROUTES.completeProfile} replace />;
  if (user.profileCompleted && location.pathname === APP_ROUTES.completeProfile)
    return <Navigate to={APP_ROUTES.home} replace />;
  return <Outlet />;
};

export const GuestOnly = () => {
  const { user, loading } = useAuthContext();
  if (loading) return <Spinner />;
  if (user)
    return (
      <Navigate
        to={
          user.profileCompleted ? APP_ROUTES.home : APP_ROUTES.completeProfile
        }
        replace
      />
    );
  return <Outlet />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route element={<GuestOnly />}>
        <Route
          path={APP_ROUTES.login}
          element={
            <>
              <LoginPage />
            </>
          }
        />
        <Route
          path={APP_ROUTES.register}
          element={
            <>
              <RegisterPage />
            </>
          }
        />
        <Route
          path={APP_ROUTES.forgotPassword}
          element={
            <>
              <ForgotPasswordPage />
            </>
          }
        />
        <Route
          path={APP_ROUTES.resetPassword}
          element={
            <>
              <ResetPasswordPage />
            </>
          }
        />
      </Route>

      <Route path={APP_ROUTES.uiKit} element={<UiKitPage />} />
      <Route element={<RequireAuth />}>
        <Route
          path={APP_ROUTES.completeProfile}
          element={<CompleteProfilePage />}
        />
        <Route path={APP_ROUTES.home} element={<HomePage />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
