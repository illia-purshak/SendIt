import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  PostalConnectionError,
  useDisconnectMeest,
  useDisconnectNovaPoshta,
  useDisconnectUkrposhta,
  usePostalConnectionsQuery,
} from "@/api/postal-connections";
import { useSubscriptionPlansQuery } from "@/api/subscriptions";
import { Button } from "@/components/Button";
import { ConnectOperatorModal } from "@/components/ConnectOperatorModal";
import { useToast } from "@/components/Toast/use-toast";
import { UpsellModal } from "@/components/UpsellModal";
import type { PostalConnection } from "@/types/postal-connections";

type Operator = "nova-post" | "ukrposhta" | "meest";

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: "bg-teal-100 text-teal-800",
  BLOCKED: "bg-neutral-100 text-neutral-600",
  INVALID: "bg-red-100 text-red-700",
};

const OPERATOR_CONFIG: Array<{ slug: Operator; label: string }> = [
  { slug: "nova-post", label: "Nova Post" },
  { slug: "ukrposhta", label: "Ukrposhta" },
  { slug: "meest", label: "Meest" },
];

export function PostalConnectionsCard() {
  const { t } = useTranslation();
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
    const invalid = data.connections.find((connection) => connection.status === "INVALID");
    if (invalid) {
      invalidToastShown.current = true;
      toast({
        title: t("profile.connectionAttentionTitle", {
          name: invalid.postalService.name,
        }),
        description: t("profile.connectionAttentionDescription"),
        color: "warning",
      });
    }
  }, [data?.connections, t, toast]);

  async function handleDisconnect(operator: Operator, id: number) {
    const disconnectFn =
      operator === "nova-post"
        ? disconnectNovaPoshta
        : operator === "ukrposhta"
          ? disconnectUkrposhta
          : disconnectMeest;

    const label = OPERATOR_CONFIG.find((item) => item.slug === operator)?.label ?? operator;

    try {
      await disconnectFn(id);
      toast({
        title: t("profile.disconnected", { name: label }),
        color: "success",
      });
    } catch (error) {
      const message =
        error instanceof PostalConnectionError
          ? error.message
          : t("profile.somethingWentWrong");
      toast({ title: t("common.error"), description: message, color: "error" });
    }
  }

  const isDisconnecting = (operator: Operator) =>
    operator === "nova-post"
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
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-neutral-900">
            {t("profile.postalOperatorsTitle")}
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            {t("profile.postalOperatorsSubtitle")}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          {OPERATOR_CONFIG.map(({ slug, label }) => {
            const connection = data?.connections.find(
              (item) => item.postalService.slug === slug,
            );
            const disconnecting = isDisconnecting(slug);

            return (
              <div
                key={slug}
                className="flex items-center justify-between rounded-xl border border-neutral-200 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-neutral-900">{label}</span>
                  {connection && (
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE[connection.status]}`}
                    >
                      {connection.status === "ACTIVE"
                        ? t("profile.connected")
                        : connection.status === "BLOCKED"
                          ? t("profile.blockedUpgradePlan")
                          : t("profile.connectionLost")}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {!connection && (
                    <Button
                      size="sm"
                      color="teal"
                      onClick={() =>
                        setActiveModal({
                          operator: slug,
                          existingConnection: null,
                        })
                      }
                    >
                      {t("profile.connect")}
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
                        {t("profile.edit")}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        color="error"
                        disabled={disconnecting}
                        onClick={() => handleDisconnect(slug, connection.id)}
                      >
                        {t("profile.disconnect")}
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
                      {t("profile.activate")} →
                    </Button>
                  )}

                  {connection?.status === "INVALID" && (
                    <Button
                      size="sm"
                      color="teal"
                      onClick={() =>
                        setActiveModal({
                          operator: slug,
                          existingConnection: connection,
                        })
                      }
                    >
                      {t("profile.updateKey")}
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
            OPERATOR_CONFIG.find((item) => item.slug === activeModal.operator)?.label ??
            activeModal.operator
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
