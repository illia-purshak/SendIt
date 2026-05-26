import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Files,
  Users,
  BarChart2,
  CreditCard,
  Bell,
  HelpCircle,
  Settings,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { APP_ROUTES } from "@/constants/app-routes";
import { roleLabel } from "@/constants/roleLabels";
import { useAuth } from "@/hooks/useAuth";
import { useUnreadCountQuery } from "@/api/notifications";
import { IconButton } from "@/components/IconButton";

type NavItem = { label: string; to: string; icon: LucideIcon };

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", to: APP_ROUTES.dashboard, icon: LayoutDashboard },
  { label: "Shipments", to: APP_ROUTES.shipments, icon: Package },
  { label: "Templates", to: APP_ROUTES.templates, icon: Files },
  { label: "Recipients", to: APP_ROUTES.recipients, icon: Users },
  { label: "Analytics", to: APP_ROUTES.analytics, icon: BarChart2 },
  { label: "Billing", to: APP_ROUTES.billing, icon: CreditCard },
];

export const MainLayout = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { data: unreadData } = useUnreadCountQuery();
  const unreadCount = unreadData?.count ?? 0;
  const identifier = user?.email ?? user?.phone ?? "";
  const role = user?.role ? (roleLabel[user.role] ?? user.role) : "";
  const initial = identifier.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-neutral-100">
      <aside className="fixed inset-y-0 left-0 z-30 flex w-60 flex-col bg-green-950">
        <div className="px-5 py-5">
          <button
            className="flex items-center gap-2.5"
            onClick={() => navigate(APP_ROUTES.dashboard)}
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-green-400">
              <Package size={14} strokeWidth={2.5} className="text-green-950" />
            </div>
            <span className="text-base font-bold tracking-tight text-white">
              SendIt
            </span>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-2">
          <ul className="flex flex-col gap-0.5">
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === APP_ROUTES.dashboard}
                  className={({ isActive }) =>
                    [
                      "flex items-center gap-3 rounded-lg border-l-2 px-3 py-2.5 text-sm font-medium transition-all duration-150",
                      isActive
                        ? "border-green-400 bg-green-700 text-white"
                        : "border-transparent text-white/60 hover:bg-green-700 hover:text-white",
                    ].join(" ")
                  }
                >
                  <item.icon size={16} />
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex flex-col gap-0.5 border-t border-white/10 p-3">
          <NavLink
            to={APP_ROUTES.settings}
            className={({ isActive }) =>
              [
                "flex items-center gap-3 rounded-lg border-l-2 px-3 py-2.5 text-sm font-medium transition-all duration-150",
                isActive
                  ? "border-green-400 bg-green-700 text-white"
                  : "border-transparent text-white/60 hover:bg-green-700 hover:text-white",
              ].join(" ")
            }
          >
            <Settings size={16} />
            Settings
          </NavLink>
          <NavLink
            to={APP_ROUTES.support}
            className={({ isActive }) =>
              [
                "flex items-center gap-3 rounded-lg border-l-2 px-3 py-2.5 text-sm font-medium transition-all duration-150",
                isActive
                  ? "border-green-400 bg-green-700 text-white"
                  : "border-transparent text-white/60 hover:bg-green-700 hover:text-white",
              ].join(" ")
            }
          >
            <HelpCircle size={16} />
            Support
          </NavLink>
          <button
            onClick={logout}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-white/50 transition-colors hover:bg-green-700 hover:text-white"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </aside>

      <div className="ml-60 flex min-h-screen flex-col overflow-hidden">
        <header className="fixed left-60 right-0 top-0 z-20 flex h-14 items-center justify-end gap-2 border-b border-neutral-200 bg-white px-6">
          <div className="relative">
            <IconButton
              aria-label="Notifications"
              variant="ghost"
              color="neutral"
              size="sm"
              title="Notifications"
              onClick={() => navigate(APP_ROUTES.notifications)}
            >
              <Bell size={16} />
            </IconButton>
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-green-400 px-1 text-[10px] font-bold leading-none text-green-950">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </div>
          <button
            onClick={() => navigate(APP_ROUTES.profile)}
            className="flex items-center gap-2.5 rounded-lg px-3 py-1.5 transition-colors hover:bg-neutral-100"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-400 text-xs font-bold text-green-950">
              {initial}
            </div>
            <div className="min-w-0 text-left">
              <p className="truncate text-sm font-medium text-neutral-900">
                {identifier}
              </p>
              <p className="text-xs text-neutral-400">{role}</p>
            </div>
          </button>
        </header>
        <main className="flex-1 overflow-y-auto px-8 pt-14">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
