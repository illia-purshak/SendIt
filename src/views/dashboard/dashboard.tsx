import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  PackagePlus,
  Truck,
  Files,
  Users,
  BarChart2,
  HelpCircle,
  ArrowRight,
  Package,
  CheckCircle2,
  CreditCard,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/Button";
import { APP_ROUTES } from "@/constants/app-routes";
import { useOnboardingChecklistQuery } from "@/api/onboarding";
import { useMySubscriptionQuery } from "@/api/subscriptions";
import { useAuth } from "@/hooks/useAuth";

const DISMISSED_KEY = "sendit.onboarding.dismissed";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function formatDate() {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());
}

type StatCard = {
  label: string;
  value: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
};

const STAT_CARDS: StatCard[] = [
  {
    label: "This month",
    value: "—",
    icon: Package,
    iconBg: "bg-green-100",
    iconColor: "text-green-700",
  },
  {
    label: "In transit",
    value: "—",
    icon: Truck,
    iconBg: "bg-info-100",
    iconColor: "text-info-600",
  },
  {
    label: "Delivered",
    value: "—",
    icon: CheckCircle2,
    iconBg: "bg-success-100",
    iconColor: "text-success-600",
  },
  {
    label: "Balance due",
    value: "—",
    icon: CreditCard,
    iconBg: "bg-warning-100",
    iconColor: "text-warning-500",
  },
];

type Action = {
  title: string;
  description: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  href: string;
};

const ACTIONS: Action[] = [
  {
    title: "Send a parcel",
    description: "Create a new shipment and get a delivery quote.",
    icon: PackagePlus,
    iconBg: "bg-green-100",
    iconColor: "text-green-700",
    href: APP_ROUTES.newShipment,
  },
  {
    title: "My shipments",
    description: "View your full shipment history and track packages.",
    icon: Truck,
    iconBg: "bg-neutral-100",
    iconColor: "text-neutral-600",
    href: APP_ROUTES.shipments,
  },
  {
    title: "Templates",
    description: "Manage reusable sender, recipient, and item templates.",
    icon: Files,
    iconBg: "bg-neutral-100",
    iconColor: "text-neutral-600",
    href: APP_ROUTES.templates,
  },
  {
    title: "Recipients",
    description: "Manage your address book for faster shipment creation.",
    icon: Users,
    iconBg: "bg-neutral-100",
    iconColor: "text-neutral-600",
    href: APP_ROUTES.recipients,
  },
  {
    title: "Analytics",
    description: "View shipment statistics and spending reports.",
    icon: BarChart2,
    iconBg: "bg-neutral-100",
    iconColor: "text-neutral-600",
    href: APP_ROUTES.analytics,
  },
  {
    title: "Support",
    description: "Get help from our team for any issues or questions.",
    icon: HelpCircle,
    iconBg: "bg-neutral-100",
    iconColor: "text-neutral-600",
    href: APP_ROUTES.support,
  },
];

function NoOperatorBanner() {
  const { data: checklist } = useOnboardingChecklistQuery();
  if (!checklist || checklist.operatorConnected) return null;

  return (
    <div className="mb-6 flex items-start gap-3 rounded-2xl border border-warning-300 bg-warning-100 px-4 py-3.5">
      <AlertTriangle size={16} className="mt-0.5 shrink-0 text-warning-500" />
      <p className="flex-1 text-sm text-warning-900">
        Підключіть поштового оператора щоб почати створювати відправлення.
      </p>
      <Button size="sm" color="warning" asChild className="shrink-0">
        <Link to={APP_ROUTES.profile}>Підключити</Link>
      </Button>
    </div>
  );
}

function OnboardingChecklist() {
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
      label: "Заповніть профіль організації",
      done: checklist.profileCompleted,
      href: APP_ROUTES.profile,
    },
    {
      label: "Підключіть поштового оператора",
      done: checklist.operatorConnected,
      href: APP_ROUTES.profile,
    },
    {
      label: "Створіть перше відправлення",
      done: checklist.firstShipmentCreated,
      href: APP_ROUTES.newShipment,
    },
  ];

  const doneCount = steps.filter((s) => s.done).length;
  const progressPct = Math.round((doneCount / steps.length) * 100);

  return (
    <div className="mb-6 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-neutral-900">
            Getting started
          </h2>
          <p className="mt-0.5 text-xs text-neutral-400">
            {doneCount} of {steps.length} steps completed
          </p>
        </div>
        <span className="text-sm font-bold text-green-700">{progressPct}%</span>
      </div>
      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-neutral-100">
        <div
          className="h-full rounded-full bg-green-400 transition-all duration-500"
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
                  ? "border-green-600 bg-green-600 text-white"
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
  const { data: balances } = useMySubscriptionQuery();
  const [now] = useState(() => Date.now());
  if (!balances) return null;

  const paid = balances.filter(
    (b) => b.status !== "EXPIRED" && b.plan.level > 0,
  );

  if (paid.length === 0) {
    return (
      <div className="mb-8 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-neutral-900">
          Subscription Balance
        </p>
        <p className="mt-1 text-sm text-neutral-500">
          No paid subscription active.
        </p>
        <Button size="sm" color="green" className="mt-3" asChild>
          <Link to={APP_ROUTES.profile}>Upgrade plan</Link>
        </Button>
      </div>
    );
  }

  const rows = paid.map((b) => ({
    balance: b,
    days:
      b.status === "ACTIVE"
        ? Math.max(
            0,
            Math.ceil(
              (new Date(b.periodEnd).getTime() - now) / 86400000,
            ),
          )
        : b.daysTotal,
  }));
  const total = rows.reduce((sum, r) => sum + r.days, 0);

  return (
    <div className="mb-8 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <p className="mb-3 text-sm font-semibold text-neutral-900">
        Subscription Balance
      </p>
      <div className="flex flex-col gap-2">
        {rows.map(({ balance, days }) => (
          <div key={balance.id} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${balance.status === "ACTIVE" ? "bg-green-500" : "bg-neutral-300"}`}
              />
              <span className="text-sm text-neutral-700">
                {balance.plan.name}
              </span>
              <span className="text-xs text-neutral-400">
                (
                {balance.status.charAt(0) +
                  balance.status.slice(1).toLowerCase()}
                )
              </span>
            </div>
            <span className="text-sm font-medium text-neutral-900">
              {balance.status === "ACTIVE"
                ? `${days} day${days === 1 ? "" : "s"} remaining`
                : `${days} day${days === 1 ? "" : "s"} paid`}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex justify-between border-t border-neutral-100 pt-3">
        <span className="text-xs text-neutral-400">Total paid days</span>
        <span className="text-sm font-semibold text-neutral-900">{total}</span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const displayName =
    user?.profile?.contactPersonName ?? user?.profile?.companyName ?? "";

  return (
    <div className="py-8">
      <div className="mb-8">
        <p className="mb-1 text-sm font-medium text-neutral-400">
          {formatDate()}
        </p>
        <h1 className="text-3xl font-bold text-neutral-900">
          {getGreeting()}
          {displayName ? (
            <span className="text-neutral-400">, {displayName}</span>
          ) : null}
        </h1>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {STAT_CARDS.map((stat, i) => (
          <div
            key={stat.label}
            className="animate-fade-up rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
            style={{ animationDelay: `${i * 55}ms` }}
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
        Quick actions
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ACTIONS.map((action, i) => (
          <button
            key={action.title}
            type="button"
            onClick={() => navigate(action.href)}
            className="group animate-fade-up flex flex-col rounded-2xl border border-neutral-200 bg-white p-6 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            style={{ animationDelay: `${(i + 4) * 55}ms` }}
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
            <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-neutral-400 transition-colors group-hover:text-green-700">
              Open
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
