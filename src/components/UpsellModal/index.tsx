import { useTranslation } from "react-i18next";
import * as Dialog from "@radix-ui/react-dialog";
import { useBuySubscriptionMutation, SubscriptionError } from "@/api/subscriptions";
import { Button } from "@/components/Button";
import { useToast } from "@/components/Toast/use-toast";
import type { SubscriptionPlan } from "@/types/subscription";

function planBadgeClass(level: number): string {
  if (level === 0) return "bg-neutral-100 text-neutral-600";
  if (level === 1) return "bg-blue-100 text-blue-800";
  if (level === 2) return "bg-purple-100 text-purple-800";
  return "bg-orange-100 text-orange-800";
}

interface UpsellModalProps {
  open: boolean;
  onClose: () => void;
  plans: SubscriptionPlan[];
}

export function UpsellModal({ open, onClose, plans }: UpsellModalProps) {
  const { t } = useTranslation();
  const { mutateAsync: buySubscription, isPending } = useBuySubscriptionMutation();
  const { toast } = useToast();

  const paidPlans = plans.filter((plan) => plan.level > 0);

  async function handleUpgrade(plan: SubscriptionPlan) {
    try {
      await buySubscription({ planId: plan.id, periodType: "MONTHLY" });
      toast({ title: t("profile.planSubscribed", { name: plan.name }), color: "success" });
      onClose();
    } catch (err) {
      const msg =
        err instanceof SubscriptionError ? err.message : t("profile.somethingWentWrong");
      toast({ title: t("common.error"), description: msg, color: "error" });
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
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
            "fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2",
            "rounded-xl bg-white p-6 shadow-xl",
            "data-[state=open]:animate-[dialog-in_200ms_ease]",
            "data-[state=closed]:animate-[dialog-out_150ms_ease]",
          ].join(" ")}
        >
          <Dialog.Title className="mb-1 text-base font-semibold text-neutral-900">
            {t("profile.operatorLimitTitle")}
          </Dialog.Title>
          <Dialog.Description className="mb-6 text-sm text-neutral-500">
            {t("profile.operatorLimitDescription")}
          </Dialog.Description>

          <div className="flex flex-col gap-3">
            {paidPlans.map((plan) => (
              <div
                key={plan.id}
                className="flex items-center justify-between rounded-xl border border-neutral-200 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${planBadgeClass(plan.level)}`}>
                    {plan.name}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-neutral-900">
                      {plan.price === 0 ? t("billingPage.free") : `₴${plan.price}/mo`}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {plan.maxOperators > 100
                        ? t("profile.unlimitedOperators")
                        : t("profile.upToOperators", { count: plan.maxOperators })}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  color="teal"
                  disabled={isPending}
                  onClick={() => handleUpgrade(plan)}
                >
                  {t("profile.upgrade")}
                </Button>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end">
            <Button variant="outline" color="neutral" onClick={onClose} disabled={isPending}>
              {t("common.cancel")}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
