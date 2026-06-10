import { type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/AlertDialog";
import { Button } from "@/components/Button";
import { ChangePlanModal } from "@/components/ChangePlanModal";
import { useToast } from "@/components/Toast/use-toast";
import {
  SubscriptionError,
  useCancelSubscriptionMutation,
  useMySubscriptionQuery,
  useSubscriptionPlansQuery,
  useUpdateSubscriptionMutation,
} from "@/api/subscriptions";
import { formatDate, t as translate } from "@/i18n/utils";
import type { UserSubscriptionBalance } from "@/types/subscription";

function planBadgeClass(level: number): string {
  if (level === 0) return "bg-neutral-100 text-neutral-600";
  if (level === 1) return "bg-blue-100 text-blue-800";
  if (level === 2) return "bg-purple-100 text-purple-800";
  return "bg-orange-100 text-orange-800";
}

function statusLabel(status: UserSubscriptionBalance["status"]): string {
  if (status === "PAUSED") return translate("profile.paused");
  if (status === "QUEUED") return translate("profile.queued");
  if (status === "ACTIVE") return translate("profile.active");
  return status;
}

function isFreePlan(balance: UserSubscriptionBalance): boolean {
  return balance.plan.level === 0 || Number(balance.plan.price) === 0;
}

function formatSubscriptionDate(iso: string) {
  return formatDate(iso);
}

function daysLeftLabel(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  const days = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  return translate("profile.daysLeft", { count: days });
}

function switchTimingLabel(iso: string | null) {
  if (!iso) return translate("profile.atMidnight");

  const diffMs = new Date(iso).getTime() - Date.now();
  const diffMinutes = Math.max(0, Math.round(diffMs / (1000 * 60)));

  if (diffMinutes < 1) return translate("profile.lessThanMinute");
  if (diffMinutes < 60) {
    return translate("profile.inMinutes", { count: diffMinutes });
  }

  const hours = Math.round(diffMinutes / 60);
  return translate("profile.inHours", { count: hours });
}

function renderBalanceMeta(balance: UserSubscriptionBalance) {
  if (isFreePlan(balance)) {
    return balance.status === "ACTIVE" ? "" : translate("profile.freePlanNoExpiry");
  }

  if (balance.status === "ACTIVE") {
    return `${daysLeftLabel(balance.periodEnd)} - ${translate("profile.untilDate", {
      date: formatSubscriptionDate(balance.periodEnd),
    })}`;
  }

  return translate("profile.daysPaid", { count: balance.daysTotal });
}

export function SubscriptionCard() {
  const { t } = useTranslation();
  const [showChangePlan, setShowChangePlan] = useState(false);
  const { data: balances, isLoading } = useMySubscriptionQuery();
  const { data: plans } = useSubscriptionPlansQuery();
  const { mutateAsync: updateSub } = useUpdateSubscriptionMutation();
  const { mutateAsync: cancelSub } = useCancelSubscriptionMutation();
  const { toast } = useToast();

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="h-5 w-32 animate-pulse rounded bg-neutral-100" />
        <div className="mt-3 h-4 w-48 animate-pulse rounded bg-neutral-100" />
      </div>
    );
  }

  if (!balances || balances.length === 0) {
    return null;
  }

  const active = balances.find((balance) => balance.status === "ACTIVE") ?? null;
  const queued = balances
    .filter((balance) => balance.status === "QUEUED")
    .sort((a, b) => a.position - b.position);
  const reserve = balances
    .filter((balance) => balance.status === "PAUSED")
    .sort((a, b) => {
      if (isFreePlan(a) && !isFreePlan(b)) return 1;
      if (!isFreePlan(a) && isFreePlan(b)) return -1;
      return a.position - b.position;
    });
  const scheduledTargetBalance =
    active?.scheduledSwitchTo != null
      ? balances.find((balance) => balance.id === active.scheduledSwitchTo) ?? null
      : null;
  const switchTiming = switchTimingLabel(active?.scheduledSwitchAt ?? null);

  async function handleAutoRenewToggle(balance: UserSubscriptionBalance) {
    try {
      await updateSub({ id: balance.id, autoRenew: !balance.autoRenew });
      toast({
        title: balance.autoRenew
          ? t("profile.autoRenewDisabled")
          : t("profile.autoRenewEnabled"),
        color: "success",
      });
    } catch (err) {
      const msg =
        err instanceof SubscriptionError ? err.message : t("profile.somethingWentWrong");
      toast({ title: t("common.error"), description: msg, color: "error" });
    }
  }

  async function handleCancelSwitch(balance: UserSubscriptionBalance) {
    try {
      await updateSub({ id: balance.id, cancelSwitch: true });
      toast({ title: t("profile.scheduledSwitchCancelled"), color: "success" });
    } catch (err) {
      const msg =
        err instanceof SubscriptionError ? err.message : t("profile.somethingWentWrong");
      toast({ title: t("common.error"), description: msg, color: "error" });
    }
  }

  async function handleScheduleSwitch(
    activeBalance: UserSubscriptionBalance,
    targetBalanceId: number,
  ) {
    try {
      await updateSub({
        id: activeBalance.id,
        scheduledSwitchTo: targetBalanceId,
      });
      toast({
        title: t("profile.switchScheduled"),
        description: t("profile.switchScheduledDescription"),
        color: "success",
      });
    } catch (err) {
      const msg =
        err instanceof SubscriptionError ? err.message : t("profile.somethingWentWrong");
      toast({ title: t("common.error"), description: msg, color: "error" });
    }
  }

  async function handleCancelSubscription(balance: UserSubscriptionBalance) {
    try {
      await cancelSub(balance.id);
      toast({ title: t("profile.subscriptionCancelled"), color: "success" });
    } catch (err) {
      const msg =
        err instanceof SubscriptionError ? err.message : t("profile.somethingWentWrong");
      toast({ title: t("common.error"), description: msg, color: "error" });
    }
  }

  function renderBalanceRow(
    balance: UserSubscriptionBalance,
    options?: {
      action?: ReactNode;
      note?: ReactNode;
      showStatus?: boolean;
    },
  ) {
    const meta = renderBalanceMeta(balance);

    return (
      <div
        key={balance.id}
        className="flex items-start justify-between rounded-lg bg-neutral-50 px-4 py-3"
      >
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={[
              "mt-1 block h-2.5 w-2.5 rounded-full border",
              balance.status === "ACTIVE"
                ? "border-teal-500 bg-teal-500"
                : "border-neutral-300 bg-transparent",
            ].join(" ")}
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${planBadgeClass(balance.plan.level)}`}
              >
                {balance.plan.name}
              </span>
              {options?.showStatus && (
                <span className="text-xs text-neutral-400">
                  {statusLabel(balance.status)}
                </span>
              )}
            </div>
            {meta && <p className="mt-1 text-sm text-neutral-600">{meta}</p>}
          </div>
        </div>

        {options?.action && (
          <div className="ml-4 flex shrink-0 flex-col items-end gap-2">
            {options.action}
            {options.note}
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">
              {t("profile.subscriptionTitle")}
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              {t("profile.subscriptionSubtitle")}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            color="teal"
            onClick={() => setShowChangePlan(true)}
          >
            {t("profile.buyPlan")}
          </Button>
        </div>

        {active && (
          <div className="mb-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
              {t("profile.activeSection")}
            </p>
            {renderBalanceRow(active)}

            {isFreePlan(active) ? (
              <p className="mt-3 text-sm text-neutral-500">
                {t("profile.freePlanNoExpiry")}
              </p>
            ) : (
              <div className="mt-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleAutoRenewToggle(active)}
                  className={[
                    "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                    active.autoRenew
                      ? "bg-teal-100 text-teal-700 hover:bg-teal-200"
                      : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200",
                  ].join(" ")}
                >
                  {t("profile.autoRenew")}:{" "}
                  {active.autoRenew ? t("common.enabled") : t("common.disabled")}
                </button>

                {active.autoRenew && (
                  <AlertDialog color="error">
                    <AlertDialogTrigger asChild>
                      <button
                        type="button"
                        className="text-xs text-red-500 underline-offset-2 hover:underline"
                      >
                        {t("profile.cancelSubscription")}
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogTitle>
                        {t("profile.cancelSubscriptionTitle")}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {t("profile.cancelSubscriptionDescription")}
                      </AlertDialogDescription>
                      <AlertDialogFooter>
                        <AlertDialogCancel>
                          {t("profile.keepSubscription")}
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleCancelSubscription(active)}>
                          {t("profile.confirmCancelSubscription")}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            )}

            {!isFreePlan(active) && !active.autoRenew && (
              <div className="mt-3 flex items-center justify-between rounded-lg bg-red-50 px-4 py-3">
                <p className="text-sm text-red-700">
                  {t("profile.cancelledOnDate", {
                    date: formatSubscriptionDate(active.periodEnd),
                  })}
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  color="error"
                  onClick={() => handleAutoRenewToggle(active)}
                  className="ml-3 shrink-0"
                >
                  {t("profile.revert")}
                </Button>
              </div>
            )}

            {scheduledTargetBalance && (
              <div className="mt-3 flex items-center justify-between rounded-lg bg-yellow-50 px-4 py-3">
                <p className="text-sm text-yellow-800">
                  {t("profile.scheduledSwitch", {
                    name: scheduledTargetBalance.plan.name,
                    timing: switchTiming,
                  })}
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  color="warning"
                  onClick={() => handleCancelSwitch(active)}
                  className="ml-3 shrink-0"
                >
                  {t("profile.cancelSwitch")}
                </Button>
              </div>
            )}
          </div>
        )}

        {queued.length > 0 && (
          <div className="border-t border-neutral-100 pt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
              {t("profile.queueSection")}
            </p>
            <div className="flex flex-col gap-2">
              {queued.map((balance) =>
                renderBalanceRow(balance, {
                  showStatus: true,
                  action: active ? (
                    <Button
                      size="sm"
                      variant="outline"
                      color="neutral"
                      onClick={() => handleScheduleSwitch(active, balance.id)}
                    >
                      {t("profile.switchNow")}
                    </Button>
                  ) : undefined,
                  note:
                    active?.scheduledSwitchTo === balance.id ? (
                      <p className="max-w-44 text-right text-xs text-neutral-500">
                        {t("profile.switchWillTakeEffect", {
                          timing: switchTiming,
                        })}
                      </p>
                    ) : undefined,
                }),
              )}
            </div>
          </div>
        )}

        {reserve.length > 0 && (
          <div className="border-t border-neutral-100 pt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
              {t("profile.reserveSection")}
            </p>
            <div className="flex flex-col gap-2">
              {reserve.map((balance) =>
                renderBalanceRow(balance, {
                  showStatus: true,
                }),
              )}
            </div>
          </div>
        )}
      </div>

      {plans && (
        <ChangePlanModal
          open={showChangePlan}
          onClose={() => setShowChangePlan(false)}
          balances={balances}
          plans={plans}
        />
      )}
    </>
  );
}
