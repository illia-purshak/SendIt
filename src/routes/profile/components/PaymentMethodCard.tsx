import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  CardAlreadyExistsError,
  useCardQuery,
  useDeleteCardMutation,
  useSaveCardMutation,
  useUpdateCardMutation,
} from "@/api/billing";
import { useMySubscriptionQuery } from "@/api/subscriptions";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { useToast } from "@/components/Toast/use-toast";

type CardFormValues = {
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cardholderName: string;
};

const EMPTY_FORM_VALUES: CardFormValues = {
  cardNumber: "",
  expiryMonth: "",
  expiryYear: "",
  cardholderName: "",
};

export function PaymentMethodCard() {
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const { data: card, isLoading } = useCardQuery();
  const {
    mutateAsync: saveCard,
    isPending: savePending,
  } = useSaveCardMutation();
  const {
    mutateAsync: updateCard,
    isPending: updatePending,
  } = useUpdateCardMutation();
  const {
    mutateAsync: deleteCard,
    isPending: deletePending,
  } = useDeleteCardMutation();
  const { data: subscription } = useMySubscriptionQuery();
  const { toast } = useToast();
  const [formValues, setFormValues] = useState<CardFormValues>(
    EMPTY_FORM_VALUES,
  );

  if (isLoading) {
    return null;
  }

  function openCreateForm() {
    setFormValues(EMPTY_FORM_VALUES);
    setShowForm(true);
  }

  function openEditForm() {
    setFormValues({
      cardNumber: "",
      expiryMonth: card ? String(card.expiryMonth).padStart(2, "0") : "",
      expiryYear: card ? String(card.expiryYear) : "",
      cardholderName: "",
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setFormValues(EMPTY_FORM_VALUES);
  }

  async function handleSave() {
    const cardNumber = formValues.cardNumber.replace(/\D/g, "");
    const cardholderName = formValues.cardholderName.trim();
    const month = parseInt(formValues.expiryMonth, 10);
    const year = parseInt(formValues.expiryYear, 10);
    const currentYear = new Date().getFullYear();

    if (
      !/^\d{13,19}$/.test(cardNumber) ||
      Number.isNaN(month) ||
      month < 1 ||
      month > 12 ||
      Number.isNaN(year) ||
      year < currentYear ||
      !cardholderName
    ) {
      toast({
        title: t("profile.cardValidation"),
        color: "warning",
      });
      return;
    }

    const cardData = {
      cardNumber,
      expiryMonth: month,
      expiryYear: year,
      cardholderName,
    };

    try {
      if (card) {
        await updateCard(cardData);
      } else {
        try {
          await saveCard(cardData);
        } catch (error) {
          if (!(error instanceof CardAlreadyExistsError)) {
            throw error;
          }
          await updateCard(cardData);
        }
      }

      toast({ title: t("profile.cardSaved"), color: "success" });
      closeForm();
    } catch {
      toast({ title: t("profile.cardSaveFailed"), color: "error" });
    }
  }

  async function handleDelete() {
    try {
      await deleteCard();
      toast({ title: t("profile.cardRemoved"), color: "success" });
      closeForm();
    } catch {
      toast({ title: t("profile.cardRemoveFailed"), color: "error" });
    }
  }

  const activeBalance = subscription?.find((balance) => balance.status === "ACTIVE");
  const isFreePlan = (activeBalance?.plan.level ?? 0) === 0;
  const isSaving = savePending || updatePending;

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-neutral-900">
          {t("profile.paymentMethodTitle")}
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          {t("profile.paymentMethodSubtitle")}
        </p>
      </div>

      {card ? (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-900">
              {card.maskedNumber}
            </p>
            <p className="mt-0.5 text-xs text-neutral-400">
              {t("profile.expires")} {String(card.expiryMonth).padStart(2, "0")}/
              {card.expiryYear}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              color="neutral"
              onClick={openEditForm}
            >
              {t("profile.editCard")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              color="error"
              disabled={deletePending}
              onClick={handleDelete}
            >
              {t("profile.delete")}
            </Button>
          </div>
        </div>
      ) : (
        <div>
          {isFreePlan && !showForm && (
            <p className="mb-3 text-sm text-neutral-500">
              {t("profile.addCardBeforePaid")}
            </p>
          )}
          {!showForm && (
            <Button size="sm" color="teal" onClick={openCreateForm}>
              {t("profile.saveCard")}
            </Button>
          )}
        </div>
      )}

      {showForm && (
        <div className="mt-4 flex flex-col gap-3">
          {card && (
            <p className="text-sm text-neutral-500">
              {t("profile.replaceCardPrompt")}
            </p>
          )}
          <Input
            label={t("profile.cardNumber")}
            placeholder="4242 4242 4242 4242"
            inputMode="numeric"
            autoComplete="cc-number"
            maxLength={23}
            value={formValues.cardNumber}
            onChange={(event) =>
              setFormValues((current) => ({
                ...current,
                cardNumber: event.target.value.replace(/[^\d\s]/g, ""),
              }))
            }
            color="teal"
          />
          <Input
            label={t("profile.cardholderName")}
            placeholder="JOHN DOE"
            autoComplete="cc-name"
            value={formValues.cardholderName}
            onChange={(event) =>
              setFormValues((current) => ({
                ...current,
                cardholderName: event.target.value,
              }))
            }
            color="teal"
          />
          <div className="flex gap-3">
            <Input
              label={t("profile.expiryMonth")}
              placeholder="12"
              inputMode="numeric"
              maxLength={2}
              value={formValues.expiryMonth}
              onChange={(event) =>
                setFormValues((current) => ({
                  ...current,
                  expiryMonth: event.target.value.replace(/\D/g, ""),
                }))
              }
              color="teal"
            />
            <Input
              label={t("profile.expiryYear")}
              placeholder="2028"
              inputMode="numeric"
              maxLength={4}
              value={formValues.expiryYear}
              onChange={(event) =>
                setFormValues((current) => ({
                  ...current,
                  expiryYear: event.target.value.replace(/\D/g, ""),
                }))
              }
              color="teal"
            />
          </div>
          <div className="flex gap-2">
            <Button color="teal" disabled={isSaving} onClick={handleSave}>
              {isSaving
                ? t("common.saving")
                : card
                  ? t("profile.updateCard")
                  : t("profile.saveCard")}
            </Button>
            <Button variant="outline" color="neutral" onClick={closeForm}>
              {t("common.cancel")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
