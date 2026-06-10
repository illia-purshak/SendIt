import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  BarChart2,
  CheckCircle2,
  CreditCard,
  Files,
  HelpCircle,
  Package,
  PackagePlus,
  Truck,
  type LucideIcon,
  Users,
} from "lucide-react";
import { useMySubscriptionQuery } from "@/api/subscriptions";
import { useOnboardingChecklistQuery } from "@/api/onboarding";
import { Button } from "@/components/Button";
import { APP_ROUTES } from "@/constants/app-routes";
import { useAuth } from "@/hooks/useAuth";
import { formatDate } from "@/i18n/utils";

const DISMISSED_KEY = "sendit.onboarding.dismissed";

function getGreetingKey() {
  const hour = new Date().getHours();
  if (hour < 12) return "dashboardPage.goodMorning";
  if (hour < 18) return "dashboardPage.goodAfternoon";
  return "dashboardPage.goodEvening";
}

type StatCard = {
  label: string;
  value: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
};

type Action = {
  title: string;
  description: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  href: string;
};

function NoOperatorBanner() {
  const { t } = useTranslation();
  const { data: checklist } = useOnboardingChecklistQuery();

  if (!checklist || checklist.operatorConnected) return null;

  return (
    <div className="mb-6 flex items-start gap-3 rounded-2xl border border-warning-300 bg-warning-100 px-4 py-3.5">
      <AlertTriangle size={16} className="mt-0.5 shrink-0 text-warning-500" />
      <p className="flex-1 text-sm text-warning-900">
        {t("dashboardPage.connectOperatorBanner")}
      </p>
      <Button size="sm" color="warning" asChild className="shrink-0">
        <Link to={APP_ROUTES.profile}>{t("dashboardPage.connectOperator")}</Link>
      </Button>
    </div>
  );
}

function OnboardingChecklist() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: checklist } = useOnboardingChecklistQuery();

  if (!checklist) return null;

  const allDone =
    checklist.profileCompleted &&
    checklist.operatorConnected &&
    checklist.firstShipmentCreated;

  if (allDone && localStorage.getItem(DISMISSED_KEY) === "true") return null;

  if (allDone) {
    localStorage.setItem(DISMISSED_KEY, "true");
    return null;
  }

  const steps = [
    {
      label: t("dashboardPage.fillProfile"),
      done: checklist.profileCompleted,
      href: APP_ROUTES.profile,
    },
    {
      label: t("dashboardPage.connectPostal"),
      done: checklist.operatorConnected,
      href: APP_ROUTES.profile,
    },
    {
      label: t("dashboardPage.firstShipment"),
      done: checklist.firstShipmentCreated,
      href: APP_ROUTES.newShipment,
    },
  ];

  const doneCount = steps.filter((step) => step.done).length;
  const progressPct = Math.round((doneCount / steps.length) * 100);

  return (
    <div className="mb-6 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-neutral-900">
            {t("dashboardPage.gettingStarted")}
          </h2>
          <p className="mt-0.5 text-xs text-neutral-400">
            {t("dashboardPage.stepsCompleted", {
              done: doneCount,
              total: steps.length,
            })}
          </p>
        </div>
        <span className="text-sm font-bold text-teal-700">{progressPct}%</span>
      </div>
      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-neutral-100">
        <div
          className="h-full rounded-full bg-teal-400 transition-all duration-500"
          style={{ width: `${progressPct}%` }}
        />
      </div>
      <div className="flex flex-col gap-1">
        {steps.map((step) => (
          <button
            key={step.label}
            type="button"
            onClick={() => navigate(step.href)}
            className="flex items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-neutral-50"
          >
            <span
              className={[
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-xs",
                step.done
                  ? "border-teal-600 bg-teal-600 text-white"
                  : "border-neutral-300 bg-white text-transparent",
              ].join(" ")}
            >
              ✓
            </span>
            <span
              className={[
                "text-sm",
                step.done
                  ? "text-neutral-400 line-through"
                  : "text-neutral-700",
              ].join(" ")}
            >
              {step.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function SubscriptionBalance() {
  const { t } = useTranslation();
  const { data: balances } = useMySubscriptionQuery();
  const [now] = useState(() => Date.now());

  if (!balances) return null;

  const paid = balances.filter(
    (balance) => balance.status !== "EXPIRED" && balance.plan.level > 0,
  );

  if (paid.length === 0) {
    return (
      <div className="mb-8 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-neutral-900">
          {t("dashboardPage.subscriptionBalance")}
        </p>
        <p className="mt-1 text-sm text-neutral-500">
          {t("dashboardPage.noPaidSubscription")}
        </p>
        <Button size="sm" color="teal" className="mt-3" asChild>
          <Link to={APP_ROUTES.profile}>{t("dashboardPage.upgradePlan")}</Link>
        </Button>
      </div>
    );
  }

  const rows = paid.map((balance) => ({
    balance,
    days:
      balance.status === "ACTIVE"
        ? Math.max(
            0,
            Math.ceil(
              (new Date(balance.periodEnd).getTime() - now) / 86400000,
            ),
          )
        : balance.daysTotal,
  }));
  const total = rows.reduce((sum, row) => sum + row.days, 0);

  return (
    <div className="mb-8 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <p className="mb-3 text-sm font-semibold text-neutral-900">
        {t("dashboardPage.subscriptionBalance")}
      </p>
      <div className="flex flex-col gap-2">
        {rows.map(({ balance, days }) => (
          <div key={balance.id} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${balance.status === "ACTIVE" ? "bg-teal-500" : "bg-neutral-300"}`}
              />
              <span className="text-sm text-neutral-700">{balance.plan.name}</span>
              <span className="text-xs text-neutral-400">
                (
                {balance.status === "ACTIVE"
                  ? t("profile.active")
                  : balance.status === "PAUSED"
                    ? t("profile.paused")
                    : balance.status === "QUEUED"
                      ? t("profile.queued")
                      : balance.status.charAt(0) +
                        balance.status.slice(1).toLowerCase()}
                )
              </span>
            </div>
            <span className="text-sm font-medium text-neutral-900">
              {balance.status === "ACTIVE"
                ? t("profile.daysLeft", { count: days })
                : t("profile.daysPaid", { count: days })}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex justify-between border-t border-neutral-100 pt-3">
        <span className="text-xs text-neutral-400">
          {t("dashboardPage.totalPaidDays")}
        </span>
        <span className="text-sm font-semibold text-neutral-900">{total}</span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const displayName =
    user?.profile?.contactPersonName ?? user?.profile?.companyName ?? "";

  const statCards: StatCard[] = useMemo(
    () => [
      {
        label: t("dashboardPage.thisMonth"),
        value: "—",
        icon: Package,
        iconBg: "bg-teal-100",
        iconColor: "text-teal-700",
      },
      {
        label: t("dashboardPage.inTransit"),
        value: "—",
        icon: Truck,
        iconBg: "bg-info-100",
        iconColor: "text-info-600",
      },
      {
        label: t("dashboardPage.delivered"),
        value: "—",
        icon: CheckCircle2,
        iconBg: "bg-success-100",
        iconColor: "text-success-600",
      },
      {
        label: t("dashboardPage.balanceDue"),
        value: "—",
        icon: CreditCard,
        iconBg: "bg-warning-100",
        iconColor: "text-warning-500",
      },
    ],
    [t],
  );

  const actions: Action[] = useMemo(
    () => [
      {
        title: t("dashboardPage.sendParcel"),
        description: t("dashboardPage.sendParcelDesc"),
        icon: PackagePlus,
        iconBg: "bg-teal-100",
        iconColor: "text-teal-700",
        href: APP_ROUTES.newShipment,
      },
      {
        title: t("dashboardPage.myShipments"),
        description: t("dashboardPage.myShipmentsDesc"),
        icon: Truck,
        iconBg: "bg-neutral-100",
        iconColor: "text-neutral-600",
        href: APP_ROUTES.shipments,
      },
      {
        title: t("dashboardPage.templates"),
        description: t("dashboardPage.templatesDesc"),
        icon: Files,
        iconBg: "bg-neutral-100",
        iconColor: "text-neutral-600",
        href: APP_ROUTES.templates,
      },
      {
        title: t("dashboardPage.recipients"),
        description: t("dashboardPage.recipientsDesc"),
        icon: Users,
        iconBg: "bg-neutral-100",
        iconColor: "text-neutral-600",
        href: APP_ROUTES.recipients,
      },
      {
        title: t("dashboardPage.analytics"),
        description: t("dashboardPage.analyticsDesc"),
        icon: BarChart2,
        iconBg: "bg-neutral-100",
        iconColor: "text-neutral-600",
        href: APP_ROUTES.analytics,
      },
      {
        title: t("dashboardPage.support"),
        description: t("dashboardPage.supportDesc"),
        icon: HelpCircle,
        iconBg: "bg-neutral-100",
        iconColor: "text-neutral-600",
        href: APP_ROUTES.support,
      },
    ],
    [t],
  );

  return (
    <div className="py-8">
      <div className="mb-8">
        <p className="mb-1 text-sm font-medium text-neutral-400">
          {formatDate(new Date(), {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
        <h1 className="text-3xl font-bold text-neutral-900">
          {t(getGreetingKey())}
          {displayName ? (
            <span className="text-neutral-400">, {displayName}</span>
          ) : null}
        </h1>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <div
            key={stat.label}
            className="animate-fade-up rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
            style={{ animationDelay: `${index * 55}ms` }}
          >
            <div
              className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${stat.iconBg}`}
            >
              <stat.icon size={18} className={stat.iconColor} />
            </div>
            <p className="text-2xl font-bold text-neutral-900">{stat.value}</p>
            <p className="mt-0.5 text-xs text-neutral-400">{stat.label}</p>
          </div>
        ))}
      </div>

      <NoOperatorBanner />
      <OnboardingChecklist />
      <SubscriptionBalance />

      <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-neutral-400">
        {t("dashboardPage.quickActions")}
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {actions.map((action, index) => (
          <button
            key={action.title}
            type="button"
            onClick={() => navigate(action.href)}
            className="group animate-fade-up flex flex-col rounded-2xl border border-neutral-200 bg-white p-6 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            style={{ animationDelay: `${(index + 4) * 55}ms` }}
          >
            <div
              className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${action.iconBg}`}
            >
              <action.icon size={20} className={action.iconColor} />
            </div>
            <p className="font-semibold text-neutral-900">{action.title}</p>
            <p className="mt-1 flex-1 text-sm text-neutral-500">
              {action.description}
            </p>
            <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-neutral-400 transition-colors group-hover:text-teal-700">
              {t("dashboardPage.open")}
              <ArrowRight
                size={12}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
