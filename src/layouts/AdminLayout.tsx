import { useEffect } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAdminProfileQuery } from "@/api/admin-profile";
import { APP_ROUTES } from "@/constants/app-routes";
import { useAdminTicketsQuery } from "@/api/admin-support";
import { syncLanguage } from "@/i18n/utils";
import { adminTokenStore } from "@/store/adminTokenStore";
import { getTicketUnreadCount } from "@/views/support/support-meta";

function navItemClass(isActive: boolean) {
  return `block rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
    isActive
      ? "bg-teal-50 text-teal-700"
      : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
  }`;
}

function getInitials(email: string | null, firstName: string | null, lastName: string | null) {
  const fromName = `${firstName ?? ""} ${lastName ?? ""}`
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  if (fromName) return fromName;

  const fallback = email?.trim()[0]?.toUpperCase();
  return fallback || "A";
}

export const AdminLayout = () => {
  const { t } = useTranslation();
  const isSuperAdmin = adminTokenStore.getIsSuperAdmin();
  const { data: profile } = useAdminProfileQuery(adminTokenStore.hasSession());
  const baseNavItems = [
    { label: t("layout.dashboard"), to: APP_ROUTES.admin.dashboard },
    { label: t("layout.users"), to: APP_ROUTES.admin.users },
    { label: t("layout.subscriptions"), to: APP_ROUTES.admin.plans },
    { label: t("layout.support"), to: APP_ROUTES.admin.support },
    { label: t("layout.myTickets"), to: APP_ROUTES.admin.mySupport },
    { label: t("layout.analytics"), to: APP_ROUTES.admin.billing },
  ];
  const navItems = isSuperAdmin
    ? [...baseNavItems, { label: t("layout.admins"), to: APP_ROUTES.admin.admins }]
    : baseNavItems;
  const { data: myTicketsData } = useAdminTicketsQuery({
    assigned: "me",
    page: 1,
    limit: 100,
  });
  const session = adminTokenStore.getSession();
  const email = profile?.email ?? session?.email ?? "admin@sendit.com";
  const currentRoleLabel = isSuperAdmin ? t("common.superAdmin") : t("common.admin");
  const initials = getInitials(
    email,
    profile?.firstName ?? session?.firstName ?? null,
    profile?.lastName ?? session?.lastName ?? null,
  );
  const myUnreadCount = (myTicketsData?.items ?? []).reduce(
    (sum, ticket) => sum + getTicketUnreadCount(ticket),
    0,
  );

  useEffect(() => {
    if (profile?.settings?.language) {
      syncLanguage(profile.settings.language);
    }
  }, [profile?.settings?.language]);

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <aside className="flex w-56 shrink-0 flex-col border-r border-neutral-200 bg-white">
        <div className="border-b border-neutral-100 px-6 py-5">
          <span className="text-lg font-bold tracking-tight text-teal-700">{t("common.appName")}</span>
          <p className="mt-0.5 text-xs font-medium text-neutral-400 uppercase tracking-wide">{t("layout.adminPanel")}</p>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="flex flex-col gap-0.5">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={
                    item.to === APP_ROUTES.admin.dashboard ||
                    item.to === APP_ROUTES.admin.support ||
                    item.to === APP_ROUTES.admin.mySupport
                  }
                  className={({ isActive }) => navItemClass(isActive)}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span>{item.label}</span>
                    {item.to === APP_ROUTES.admin.mySupport && myUnreadCount > 0 ? (
                      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-teal-700 px-1.5 text-[11px] font-semibold text-white">
                        {myUnreadCount > 99 ? "99+" : myUnreadCount}
                      </span>
                    ) : null}
                  </span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-neutral-100 p-3">
          <NavLink
            to={APP_ROUTES.admin.settings}
            className={({ isActive }) => navItemClass(isActive)}
          >
            {t("layout.settings")}
          </NavLink>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="border-b border-neutral-200 bg-white px-8 py-4">
          <div className="flex items-center justify-end">
            <NavLink
              to={APP_ROUTES.admin.profile}
              className="flex items-center gap-3 rounded-2xl border border-transparent px-2 py-1.5 transition-colors hover:border-neutral-200 hover:bg-neutral-50"
            >
              {(profile?.avatarUrl ?? session?.avatarUrl) ? (
                <img
                  src={profile?.avatarUrl ?? session?.avatarUrl ?? ""}
                  alt={email}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 text-sm font-semibold text-teal-700">
                  {initials}
                </div>
              )}
              <div className="min-w-0 text-right">
                <p className="truncate text-sm font-medium text-neutral-900">{email}</p>
                <p className="text-xs font-medium text-neutral-500">{currentRoleLabel}</p>
              </div>
            </NavLink>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
