import { Button } from "@/components/Button";
import { Link } from "@/components/Link";
import { APP_ROUTES } from "@/constants/app-routes";
import { roleLabel } from "@/constants/roleLabels";
import { useAuth } from "@/hooks/useAuth";
import { Outlet, useNavigate } from "react-router-dom";

export const MainLayout = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const identifier =
    user?.email ?? (user as { phoneNumber?: string })?.phoneNumber ?? "";

  const role = user?.role ? (roleLabel[user.role] ?? user.role) : "";
  const type = user?.type === "ORGANIZATION" ? "Organization" : "Individual";

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-5xl lg:max-w-350 mx-auto px-6">
        <header className="border-b border-neutral-200 bg-white">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <button
                className="text-lg font-bold tracking-tight text-green-700 hover:text-green-800"
                onClick={() => navigate(APP_ROUTES.home)}
              >
                SendIt
              </button>
              <span className="text-neutral-300">/</span>
              <button
                className="text-sm font-medium text-neutral-500 hover:text-neutral-700"
                onClick={() => navigate(APP_ROUTES.parcelTemplates)}
              >
                Parcel Templates
              </button>
              <span className="text-neutral-300">/</span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href={APP_ROUTES.profile}
                className="text-right"
                variant="nav"
              >
                <p className="text-sm font-medium text-neutral-900">
                  {identifier}
                </p>
                <p className="text-xs text-neutral-500">
                  {role} · {type}
                </p>
              </Link>
              <Button color="green" onClick={logout} className="text-sm">
                Sign out
              </Button>
            </div>
          </div>
        </header>
        <Outlet />
      </div>
    </div>
  );
};
