import { useState } from "react";
import { useTranslation } from "react-i18next";
import * as Dialog from "@radix-ui/react-dialog";
import { useBuySubscriptionMutation, SubscriptionError } from "@/api/subscriptions";
import { Button } from "@/components/Button";
import { useToast } from "@/components/Toast/use-toast";
import type { SubscriptionPlan, UserSubscriptionBalance } from "@/types/subscription";

function planBadgeClass(level: number): string {
  if (level === 0) return "bg-neutral-100 text-neutral-600";
  if (level === 1) return "bg-blue-100 text-blue-800";
  if (level === 2) return "bg-purple-100 text-purple-800";
  return "bg-orange-100 text-orange-800";
}

interface ChangePlanModalProps {
  open: boolean;
  onClose: () => void;
  balances: UserSubscriptionBalance[];
  plans: SubscriptionPlan[];
}

type Step = "select" | "activation" | "confirm";

export function ChangePlanModal({ open, onClose, balances, plans }: ChangePlanModalProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>("select");
  const [selected, setSelected] = useState<SubscriptionPlan | null>(null);
  const [activateNow, setActivateNow] = useState(false);
  const { toast } = useToast();
  const { mutateAsync: buySubscription, isPending } = useBuySubscriptionMutation();

  const activePaidBalance = balances.find(
    (balance) => balance.status === "ACTIVE" && balance.plan.level > 0,
  );

  function handleSelect(plan: SubscriptionPlan) {
    setSelected(plan);
    if (plan.level === 0 || !activePaidBalance) {
      setActivateNow(false);
      setStep("confirm");
    } else {
      setStep("activation");
    }
  }

  async function handleConfirm() {
    if (!selected) return;
    try {
      await buySubscription({
        planId: selected.id,
        periodType: "MONTHLY",
        ...(activePaidBalance && selected.level > 0 ? { activateNow } : {}),
      });
      toast({
        title: t("profile.planSubscribed", { name: selected.name }),
        color: "success",
      });
      handleClose();
    } catch (err) {
      const msg =
        err instanceof SubscriptionError ? err.message : t("profile.somethingWentWrong");
      toast({ title: t("common.error"), description: msg, color: "error" });
    }
  }

  function handleClose() {
    onClose();
    setStep("select");
    setSelected(null);
    setActivateNow(false);
  }

  return (
    <Dialog.Root open={open} onOpenChange={(nextOpen) => !nextOpen && handleClose()}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={[
            "fixed inset-0 z-50 bg-black/50",
            "data-[state=open]:animate-[dialog-overlay-in_200ms_ease]",
            "data-[state=closed]:animate-[dialog-overlay-out_150ms_ease]",
          ].join(" ")}
        />
        <Dialog.Content
          className={[
            "fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2",
            "rounded-xl bg-white p-6 shadow-xl",
            "data-[state=open]:animate-[dialog-in_200ms_ease]",
            "data-[state=closed]:animate-[dialog-out_150ms_ease]",
          ].join(" ")}
        >
          {step === "select" && (
            <>
              <Dialog.Title className="mb-1 text-base font-semibold text-neutral-900">
                {t("profile.planModalTitle")}
              </Dialog.Title>
              <Dialog.Description className="mb-6 text-sm text-neutral-500">
                {t("profile.planModalDescription")}
              </Dialog.Description>

              <div className="grid grid-cols-3 gap-3">
                {plans
                  .filter((plan) => plan.level > 0)
                  .map((plan) => {
                    const isActive = balances.some(
                      (balance) =>
                        balance.plan.id === plan.id && balance.status === "ACTIVE",
                    );
                    return (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => handleSelect(plan)}
                        className={[
                          "flex cursor-pointer flex-col gap-2 rounded-xl border-2 p-4 text-left transition-colors",
                          isActive
                            ? "border-teal-500 bg-teal-50"
                            : "border-neutral-200 hover:border-neutral-400",
                        ].join(" ")}
                      >
                        <span
                          className={`self-start rounded-full px-2 py-0.5 text-xs font-semibold ${planBadgeClass(plan.level)}`}
                        >
                          {plan.name}
                        </span>
                        <p className="text-sm font-semibold text-neutral-900">
                          ₴{plan.price}/mo
                        </p>
                        {plan.priceYearly && (
                          <p className="text-xs text-neutral-400">
                            ₴{plan.priceYearly}/yr
                          </p>
                        )}
                        {isActive && (
                          <span className="text-xs font-medium text-teal-600">
                            {t("profile.active")}
                          </span>
                        )}
                      </button>
                    );
                  })}
              </div>

              <div className="mt-6 flex justify-end">
                <Button variant="outline" color="neutral" onClick={handleClose}>
                  {t("common.cancel")}
                </Button>
              </div>
            </>
          )}

          {step === "activation" && selected && (
            <>
              <Dialog.Title className="mb-1 text-base font-semibold text-neutral-900">
                {t("profile.planActivationTitle")}
              </Dialog.Title>
              <Dialog.Description className="mb-4 text-sm text-neutral-500">
                {t("profile.planActivationDescription", { name: selected.name })}
              </Dialog.Description>

              <div className="flex flex-col gap-3">
                <label
                  className={[
                    "flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 transition-colors",
                    activateNow
                      ? "border-teal-500 bg-teal-50"
                      : "border-neutral-200 hover:border-neutral-300",
                  ].join(" ")}
                >
                  <input
                    type="radio"
                    name="activateNow"
                    checked={activateNow}
                    onChange={() => setActivateNow(true)}
                    className="mt-0.5 accent-teal-600"
                  />
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">
                      {t("profile.activateNow")}
                    </p>
                    <p className="mt-0.5 text-xs text-neutral-500">
                      {t("profile.activateNowDescription", {
                        name: selected.name,
                      })}
                    </p>
                  </div>
                </label>

                <label
                  className={[
                    "flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 transition-colors",
                    !activateNow
                      ? "border-teal-500 bg-teal-50"
                      : "border-neutral-200 hover:border-neutral-300",
                  ].join(" ")}
                >
                  <input
                    type="radio"
                    name="activateNow"
                    checked={!activateNow}
                    onChange={() => setActivateNow(false)}
                    className="mt-0.5 accent-teal-600"
                  />
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">
                      {t("profile.addToQueue")}
                    </p>
                    <p className="mt-0.5 text-xs text-neutral-500">
                      {t("profile.addToQueueDescription", { name: selected.name })}
                    </p>
                  </div>
                </label>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <Button
                  variant="outline"
                  color="neutral"
                  onClick={() => setStep("select")}
                >
                  {t("common.back")}
                </Button>
                <Button color="teal" onClick={() => setStep("confirm")}>
                  {t("common.continue")}
                </Button>
              </div>
            </>
          )}

          {step === "confirm" && selected && (
            <>
              <Dialog.Title className="mb-1 text-base font-semibold text-neutral-900">
                {t("profile.confirmPurchaseTitle")}
              </Dialog.Title>
              <p className="mt-2 text-sm text-neutral-600">
                {t("profile.confirmPurchaseDescription", {
                  name: selected.name,
                  price: selected.price,
                })}{" "}
                {activePaidBalance && selected.level > 0
                  ? activateNow
                    ? t("profile.activateImmediately")
                    : t("profile.activateAfterCurrent")
                  : t("profile.activateImmediatelySimple")}
              </p>

              <div className="mt-6 flex justify-end gap-3">
                <Button
                  variant="outline"
                  color="neutral"
                  onClick={() =>
                    setStep(activePaidBalance && selected.level > 0 ? "activation" : "select")
                  }
                  disabled={isPending}
                >
                  {t("common.back")}
                </Button>
                <Button
                  color="teal"
                  onClick={handleConfirm}
                  disabled={isPending}
                >
                  {isPending ? t("common.processing") : t("profile.confirm")}
                </Button>
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
