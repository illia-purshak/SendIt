import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/Button";
import { ConnectOperatorModal } from "@/components/ConnectOperatorModal";
import { UpsellModal } from "@/components/UpsellModal";
import { useToast } from "@/components/Toast/use-toast";
import {
  PostalConnectionError,
  useDisconnectNovaPoshta,
  useDisconnectUkrposhta,
  useDisconnectMeest,
  usePostalConnectionsQuery,
} from "@/api/postal-connections";
import { useSubscriptionPlansQuery } from "@/api/subscriptions";
import type { PostalConnection } from "@/types/postal-connections";

type Operator = "nova-poshta" | "ukrposhta" | "meest";

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  BLOCKED: "bg-neutral-100 text-neutral-600",
  INVALID: "bg-red-100 text-red-700",
};

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Connected",
  BLOCKED: "Blocked - upgrade plan",
  INVALID: "Connection lost",
};

const OPERATOR_CONFIG: Array<{ slug: Operator; label: string }> = [
  { slug: "nova-poshta", label: "Nova Poshta" },
  { slug: "ukrposhta", label: "Ukrposhta" },
  { slug: "meest", label: "Meest Express" },
];

export function PostalConnectionsCard() {
  const [activeModal, setActiveModal] = useState<{
    operator: Operator;
    existingConnection: PostalConnection | null;
  } | null>(null);
  const [showUpsell, setShowUpsell] = useState(false);
  const { data, isLoading } = usePostalConnectionsQuery();
  const { mutateAsync: disconnectNovaPoshta, isPending: disconnectingNP } =
    useDisconnectNovaPoshta();
  const { mutateAsync: disconnectUkrposhta, isPending: disconnectingUkr } =
    useDisconnectUkrposhta();
  const { mutateAsync: disconnectMeest, isPending: disconnectingMeest } =
    useDisconnectMeest();
  const { data: plans } = useSubscriptionPlansQuery();
  const { toast } = useToast();
  const invalidToastShown = useRef(false);

  useEffect(() => {
    if (invalidToastShown.current || !data?.connections) return;
    const invalid = data.connections.find((c) => c.status === "INVALID");
    if (invalid) {
      invalidToastShown.current = true;
      toast({
        title: `Your ${invalid.postalService.name} connection requires attention`,
        description: "Update your API key to restore access.",
        color: "warning",
      });
    }
  }, [data?.connections, toast]);

  async function handleDisconnect(operator: Operator) {
    const disconnectFn =
      operator === "nova-poshta"
        ? disconnectNovaPoshta
        : operator === "ukrposhta"
          ? disconnectUkrposhta
          : disconnectMeest;

    const label = OPERATOR_CONFIG.find((o) => o.slug === operator)!.label;

    try {
      await disconnectFn();
      toast({ title: `${label} disconnected`, color: "success" });
    } catch (error) {
      const message =
        error instanceof PostalConnectionError
          ? error.message
          : "Something went wrong";
      toast({ title: "Error", description: message, color: "error" });
    }
  }

  const isDisconnecting = (operator: Operator) =>
    operator === "nova-poshta"
      ? disconnectingNP
      : operator === "ukrposhta"
        ? disconnectingUkr
        : disconnectingMeest;

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="h-5 w-40 animate-pulse rounded bg-neutral-100" />
        <div className="mt-4 h-10 animate-pulse rounded-lg bg-neutral-100" />
      </div>
    );
  }

  return (
    <>
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-neutral-900">
          Postal operators
        </h2>

        <div className="flex flex-col gap-2">
          {OPERATOR_CONFIG.map(({ slug, label }) => {
            const connection = data?.connections.find(
              (c) => c.postalService.slug === slug
            );
            const disconnecting = isDisconnecting(slug);

            return (
              <div
                key={slug}
                className="flex items-center justify-between rounded-xl border border-neutral-200 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-neutral-900">
                    {label}
                  </span>
                  {connection && (
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE[connection.status]}`}
                    >
                      {STATUS_LABEL[connection.status]}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {!connection && (
                    <Button
                      size="sm"
                      color="green"
                      onClick={() =>
                        setActiveModal({
                          operator: slug,
                          existingConnection: null,
                        })
                      }
                    >
                      Connect
                    </Button>
                  )}

                  {connection?.status === "ACTIVE" && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        color="neutral"
                        onClick={() =>
                          setActiveModal({
                            operator: slug,
                            existingConnection: connection,
                          })
                        }
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        color="error"
                        disabled={disconnecting}
                        onClick={() => handleDisconnect(slug)}
                      >
                        Disconnect
                      </Button>
                    </>
                  )}

                  {connection?.status === "BLOCKED" && (
                    <Button
                      size="sm"
                      variant="outline"
                      color="neutral"
                      onClick={() => setShowUpsell(true)}
                    >
                      Activate →
                    </Button>
                  )}

                  {connection?.status === "INVALID" && (
                    <Button
                      size="sm"
                      color="green"
                      onClick={() =>
                        setActiveModal({
                          operator: slug,
                          existingConnection: connection,
                        })
                      }
                    >
                      Update key
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {activeModal && (
        <ConnectOperatorModal
          open
          onClose={() => setActiveModal(null)}
          operator={activeModal.operator}
          operatorName={
            OPERATOR_CONFIG.find((o) => o.slug === activeModal.operator)!.label
          }
          existingConnection={activeModal.existingConnection}
          onOperatorLimitReached={() => {
            setActiveModal(null);
            setShowUpsell(true);
          }}
        />
      )}

      {plans && (
        <UpsellModal
          open={showUpsell}
          onClose={() => setShowUpsell(false)}
          plans={plans}
        />
      )}
    </>
  );
}
