import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/Button";
import { useBuySubscriptionMutation, SubscriptionError } from "@/api/subscriptions";
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
  const [step, setStep] = useState<Step>("select");
  const [selected, setSelected] = useState<SubscriptionPlan | null>(null);
  const [activateNow, setActivateNow] = useState(false);
  const { toast } = useToast();
  const { mutateAsync: buySubscription, isPending } = useBuySubscriptionMutation();

  const activePaidBalance = balances.find(
    (b) => b.status === "ACTIVE" && b.plan.level > 0
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
        title: `Subscribed to ${selected.name}`,
        color: "success",
      });
      handleClose();
    } catch (err) {
      const msg =
        err instanceof SubscriptionError ? err.message : "Something went wrong";
      toast({ title: "Error", description: msg, color: "error" });
    }
  }

  function handleClose() {
    onClose();
    setStep("select");
    setSelected(null);
    setActivateNow(false);
  }

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && handleClose()}>
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
                Buy a plan
              </Dialog.Title>
              <Dialog.Description className="mb-6 text-sm text-neutral-500">
                Select a plan to add to your subscription pool.
              </Dialog.Description>

              <div className="grid grid-cols-3 gap-3">
                {plans
                  .filter((p) => p.level > 0)
                  .map((plan) => {
                    const isActive = balances.some(
                      (b) => b.plan.id === plan.id && b.status === "ACTIVE"
                    );
                    return (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => handleSelect(plan)}
                        className={[
                          "flex flex-col gap-2 rounded-xl border-2 p-4 text-left transition-colors",
                          isActive
                            ? "border-green-500 bg-green-50"
                            : "border-neutral-200 hover:border-neutral-400 cursor-pointer",
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
                          <span className="text-xs font-medium text-green-600">
                            Active
                          </span>
                        )}
                      </button>
                    );
                  })}
              </div>

              <div className="mt-6 flex justify-end">
                <Button variant="outline" color="neutral" onClick={handleClose}>
                  Cancel
                </Button>
              </div>
            </>
          )}

          {step === "activation" && selected && (
            <>
              <Dialog.Title className="mb-1 text-base font-semibold text-neutral-900">
                When to activate?
              </Dialog.Title>
              <Dialog.Description className="mb-4 text-sm text-neutral-500">
                You already have an active plan. Choose when{" "}
                <span className="font-semibold">{selected.name}</span> should
                start.
              </Dialog.Description>

              <div className="flex flex-col gap-3">
                <label
                  className={[
                    "flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 transition-colors",
                    activateNow
                      ? "border-green-500 bg-green-50"
                      : "border-neutral-200 hover:border-neutral-300",
                  ].join(" ")}
                >
                  <input
                    type="radio"
                    name="activateNow"
                    checked={activateNow}
                    onChange={() => setActivateNow(true)}
                    className="mt-0.5 accent-green-600"
                  />
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">
                      Activate now
                    </p>
                    <p className="mt-0.5 text-xs text-neutral-500">
                      Current plan is paused, {selected.name} starts today.
                    </p>
                  </div>
                </label>

                <label
                  className={[
                    "flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 transition-colors",
                    !activateNow
                      ? "border-green-500 bg-green-50"
                      : "border-neutral-200 hover:border-neutral-300",
                  ].join(" ")}
                >
                  <input
                    type="radio"
                    name="activateNow"
                    checked={!activateNow}
                    onChange={() => setActivateNow(false)}
                    className="mt-0.5 accent-green-600"
                  />
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">
                      Add to queue
                    </p>
                    <p className="mt-0.5 text-xs text-neutral-500">
                      {selected.name} activates after your current plan ends.
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
                  Back
                </Button>
                <Button color="green" onClick={() => setStep("confirm")}>
                  Continue
                </Button>
              </div>
            </>
          )}

          {step === "confirm" && selected && (
            <>
              <Dialog.Title className="mb-1 text-base font-semibold text-neutral-900">
                Confirm purchase
              </Dialog.Title>
              <p className="mt-2 text-sm text-neutral-600">
                You are buying{" "}
                <span className="font-semibold">{selected.name}</span> (monthly,
                ₴{selected.price}/mo).{" "}
                {activePaidBalance && selected.level > 0
                  ? activateNow
                    ? "It will activate immediately — your current plan will be paused."
                    : "It will be added to your queue and activate after your current plan ends."
                  : "It will activate immediately."}
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
                  Back
                </Button>
                <Button
                  color="green"
                  onClick={handleConfirm}
                  disabled={isPending}
                >
                  {isPending ? "Processing…" : "Confirm"}
                </Button>
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
