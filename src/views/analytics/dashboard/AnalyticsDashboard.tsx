import type { CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { useAnalyticsDashboardQuery } from "@/api/analytics";
import { Spinner } from "@/components/Loader/Spinner";
import type { ConnectionStatus } from "@/types/analytics";
import DonutChart from "./DonutChart";
import HorizontalBars from "./HorizontalBars";
import TrendChart from "./TrendChart";
import SpendBars from "./SpendBars";

const MONO: CSSProperties = { fontFamily: "'DM Mono', monospace" };

const PLAN_STYLE: Record<number, string> = {
  0: "bg-neutral-100 text-neutral-600",
  1: "bg-teal-50 text-teal-700",
  2: "bg-purple-50 text-purple-700",
};

const CONN_STYLE: Record<ConnectionStatus, string> = {
  ACTIVE: "bg-teal-50 text-teal-700",
  BLOCKED: "bg-amber-50 text-amber-700",
  INVALID: "bg-red-50 text-red-700",
};

type MetricCardVariant = "default" | "featured" | "compact";

function MetricCard({
  label,
  value,
  variant = "default",
  children,
}: {
  label: string;
  value?: string;
  variant?: MetricCardVariant;
  children?: React.ReactNode;
}) {
  const cardClassName =
    variant === "featured"
      ? "lg:col-span-2 lg:row-span-2 min-h-[11.5rem]"
      : variant === "compact"
        ? "min-h-[9.5rem]"
        : "min-h-[10rem]";

  const valueClassName =
    variant === "featured"
      ? "text-[clamp(2rem,4vw,3.5rem)] leading-[1.05] sm:text-[clamp(2.25rem,3.6vw,4rem)]"
      : variant === "compact"
        ? "text-3xl leading-tight sm:text-[2rem]"
        : "text-[clamp(2rem,3vw,3rem)] leading-[1.1]";

  return (
    <div
      className={`min-w-0 overflow-hidden rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6 ${cardClassName}`}
    >
      <div className="flex h-full min-w-0 flex-col justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-neutral-500">
            {label}
          </p>
          {value ? (
            <p
              className={`mt-3 min-w-0 max-w-full whitespace-normal break-words text-neutral-950 tabular-nums [overflow-wrap:anywhere] ${valueClassName}`}
              style={MONO}
            >
              {value}
            </p>
          ) : null}
        </div>
        {children ? <div className="min-w-0">{children}</div> : null}
      </div>
    </div>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <p className="mb-4 text-sm font-semibold text-neutral-800">{title}</p>
      {children}
    </div>
  );
}

function formatMoney(n: number) {
  return `₴${n.toLocaleString("uk-UA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function AnalyticsDashboard() {
  const navigate = useNavigate();
  const { data, isLoading, error } = useAnalyticsDashboardQuery();

  if (isLoading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center py-10">
        <Spinner />
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="py-10">
        <button
          onClick={() => navigate("/analytics")}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-800"
        >
          <ArrowLeft size={15} />
          Back to Analytics
        </button>
        <div className="flex min-h-60 flex-col items-center justify-center gap-3 rounded-2xl border border-red-100 bg-red-50 py-16 text-center">
          <AlertCircle size={28} className="text-red-400" />
          <p className="text-base font-semibold text-red-700">
            Failed to load dashboard
          </p>
          <p className="text-sm text-red-500">
            {error instanceof Error
              ? error.message
              : "An unexpected error occurred."}
          </p>
        </div>
      </main>
    );
  }

  const { shipments, account, billing } = data;

  const plan = billing.currentPlan;
  const planName = plan?.name ?? "FREE";
  const planLevel = plan?.level ?? 0;
  const planStyle = PLAN_STYLE[planLevel] ?? PLAN_STYLE[0];
  const periodEnd = plan?.periodEnd
    ? new Date(plan.periodEnd).toLocaleDateString("uk-UA", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  const successRatePct = `${Math.round(shipments.deliverySuccessRate * 100)}%`;

  return (
    <main className="py-10">
      <div className="mb-8 flex items-center gap-4">
        <button
          onClick={() => navigate("/analytics")}
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-800"
        >
          <ArrowLeft size={15} />
          Back
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">
            Analytics Dashboard
          </h1>
          <p className="mt-0.5 text-sm text-neutral-500">All-time overview</p>
        </div>
      </div>

      {/* Top stat cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Delivery Rate" value={successRatePct} />
        <MetricCard
          label="Templates"
          value={String(account.templatesCount)}
          variant="compact"
        />
        <MetricCard
          label="Total Spend"
          value={formatMoney(billing.totalSpent)}
          variant="featured"
        />
        <MetricCard label="Plan" variant="default">
          <div className="flex min-w-0 flex-col gap-3">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <span
                className={`max-w-full rounded-full px-2.5 py-1 text-sm font-semibold ${planStyle}`}
              >
                {planName}
              </span>
            </div>
            {periodEnd ? (
              <p className="text-xs text-neutral-400">Renews {periodEnd}</p>
            ) : (
              <p className="text-xs text-neutral-400">No renewal date</p>
            )}
          </div>
        </MetricCard>
        <MetricCard
          label="Drafts"
          value={String(account.draftsCount)}
          variant="compact"
        />
        <MetricCard label="Total Shipments" value={String(shipments.total)} />
      </div>

      {/* Operator donut + Status bars */}
      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <SectionCard title="Shipments by Operator">
          <DonutChart
            ukrposhta={shipments.byOperator.ukrposhta}
            meest={shipments.byOperator.meest}
          />
        </SectionCard>

        <SectionCard title="Shipments by Status">
          <HorizontalBars byStatus={shipments.byStatus} />
        </SectionCard>
      </div>

      {/* 30-day trend */}
      <div className="mb-6">
        <SectionCard title="30-Day Shipment Trend">
          <TrendChart data={shipments.trend} />
        </SectionCard>
      </div>

      {/* 6-month spend */}
      <div className="mb-6">
        <SectionCard title="Monthly Spend (last 6 months)">
          <SpendBars data={billing.monthlySpend} />
        </SectionCard>
      </div>

      {/* Connected operators */}
      {account.connections.length > 0 && (
        <SectionCard title="Connected Operators">
          <div className="flex flex-wrap gap-3">
            {account.connections.map((conn) => (
              <div
                key={conn.slug}
                className="flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5"
              >
                {conn.logoUrl && (
                  <img
                    src={conn.logoUrl}
                    alt={conn.name}
                    className="h-4 w-4 rounded-full object-contain"
                  />
                )}
                <span className="text-sm font-medium text-neutral-800">
                  {conn.name}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${CONN_STYLE[conn.status]}`}
                >
                  {conn.status === "ACTIVE"
                    ? "Active"
                    : conn.status === "BLOCKED"
                      ? "Blocked"
                      : "Invalid"}
                </span>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </main>
  );
}
