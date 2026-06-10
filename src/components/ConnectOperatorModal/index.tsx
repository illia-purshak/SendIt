import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as Dialog from "@radix-ui/react-dialog";
import type { z } from "zod";
import {
  ConnectionNotFoundError,
  PostalConnectionError,
  PostalOperatorLimitError,
  useConnectMeest,
  useConnectNovaPoshta,
  useConnectUkrposhta,
  useRequestNovaPostKey,
  useUpdateMeestKey,
  useUpdateNovaPoshtaKey,
  useUpdateUkrposhtaKey,
} from "@/api/postal-connections";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { useToast } from "@/components/Toast/use-toast";
import type { PostalConnection } from "@/types/postal-connections";
import { connectOperatorSchema, requestKeySchema } from "@/validation/postal-connections";

type PhoneFormValues = z.infer<typeof requestKeySchema>;
type KeyFormValues = z.infer<typeof connectOperatorSchema>;
type Operator = "nova-post" | "ukrposhta" | "meest";

interface ConnectOperatorModalProps {
  open: boolean;
  onClose: () => void;
  operator: Operator;
  operatorName: string;
  existingConnection: PostalConnection | null;
  onOperatorLimitReached?: () => void;
}

export function ConnectOperatorModal({
  open,
  onClose,
  operator,
  operatorName,
  existingConnection,
  onOperatorLimitReached,
}: ConnectOperatorModalProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const isUpdate = Boolean(existingConnection);
  const [step, setStep] = useState<1 | 2>(operator === "nova-post" ? 1 : 2);
  const [prefillApiKey, setPrefillApiKey] = useState("");
  const [apiError, setApiError] = useState<string | null>(null);

  const { mutateAsync: requestKey, isPending: requestKeyPending } = useRequestNovaPostKey();
  const { mutateAsync: connectNovaPoshta, isPending: connectNPPending } = useConnectNovaPoshta();
  const { mutateAsync: updateNovaPoshta, isPending: updateNPPending } = useUpdateNovaPoshtaKey();
  const { mutateAsync: connectUkrposhta, isPending: connectUkrPending } = useConnectUkrposhta();
  const { mutateAsync: updateUkrposhta, isPending: updateUkrPending } = useUpdateUkrposhtaKey();
  const { mutateAsync: connectMeest, isPending: connectMeestPending } = useConnectMeest();
  const { mutateAsync: updateMeest, isPending: updateMeestPending } = useUpdateMeestKey();

  const connectFn =
    operator === "nova-post"
      ? connectNovaPoshta
      : operator === "ukrposhta"
        ? connectUkrposhta
        : connectMeest;
  const updateFn =
    operator === "nova-post"
      ? updateNovaPoshta
      : operator === "ukrposhta"
        ? updateUkrposhta
        : updateMeest;
  const connectPending =
    operator === "nova-post"
      ? connectNPPending
      : operator === "ukrposhta"
        ? connectUkrPending
        : connectMeestPending;
  const updatePending =
    operator === "nova-post"
      ? updateNPPending
      : operator === "ukrposhta"
        ? updateUkrPending
        : updateMeestPending;

  const phoneForm = useForm<PhoneFormValues>({
    resolver: zodResolver(requestKeySchema),
    defaultValues: { phone: "" },
  });

  const keyForm = useForm<KeyFormValues>({
    resolver: zodResolver(connectOperatorSchema),
    defaultValues: { apiKey: "" },
  });

  function handleClose() {
    phoneForm.reset();
    keyForm.reset();
    setStep(operator === "nova-post" ? 1 : 2);
    setPrefillApiKey("");
    setApiError(null);
    onClose();
  }

  function handleBack() {
    keyForm.reset();
    setApiError(null);
    setStep(1);
  }

  async function onPhoneSubmit(values: PhoneFormValues) {
    setApiError(null);
    try {
      const data = await requestKey({ phone: values.phone });
      keyForm.setValue("apiKey", data.apiKey);
      setPrefillApiKey(data.apiKey);
      setStep(2);
    } catch (err) {
      if (err instanceof PostalConnectionError) {
        setApiError(err.message);
      } else {
        setApiError(err instanceof Error ? err.message : t("profile.somethingWentWrong"));
      }
    }
  }

  async function onKeySubmit(values: KeyFormValues) {
    setApiError(null);
    try {
      if (isUpdate) {
        await updateFn({ id: existingConnection!.id, apiKey: values.apiKey });
        toast({ title: t("profile.apiKeyUpdated"), color: "success" });
      } else {
        await connectFn({ apiKey: values.apiKey });
        toast({ title: t("profile.connectedOperator", { name: operatorName }), color: "success" });
      }
      handleClose();
    } catch (err) {
      if (err instanceof PostalOperatorLimitError) {
        onOperatorLimitReached?.();
        handleClose();
      } else if (err instanceof ConnectionNotFoundError) {
        setApiError(t("profile.noExistingConnection"));
      } else if (err instanceof PostalConnectionError) {
        if (err.status === 400) {
          setApiError(
            isUpdate
              ? t("profile.operatorRejectedUpdate")
              : t("profile.invalidOperatorKey"),
          );
        } else {
          setApiError(err.message);
        }
      } else {
        setApiError(err instanceof Error ? err.message : t("profile.somethingWentWrong"));
      }
    }
  }

  const title = isUpdate
    ? t("profile.updateOperatorKeyTitle", { name: operatorName })
    : t("profile.connectOperatorTitle", { name: operatorName });
  const isNovaPost = operator === "nova-post";

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
            "fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2",
            "rounded-xl bg-white p-6 shadow-xl",
            "data-[state=open]:animate-[dialog-in_200ms_ease]",
            "data-[state=closed]:animate-[dialog-out_150ms_ease]",
          ].join(" ")}
        >
          <Dialog.Title className="mb-1 text-base font-semibold text-neutral-900">
            {title}
          </Dialog.Title>

          {!isUpdate ? (
            <>
              <Dialog.Description className="mb-6 text-sm text-neutral-500">
                {isNovaPost && step === 1
                  ? t("profile.novaPostRequestKeyDescription")
                  : t("profile.operatorApiKeyDescription")}
              </Dialog.Description>

              {isNovaPost && step === 1 ? (
                <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)} className="flex flex-col gap-4">
                  <Controller
                    control={phoneForm.control}
                    name="phone"
                    render={({ field, fieldState }) => (
                      <Input
                        label={t("profile.phoneNumber")}
                        type="tel"
                        placeholder="380XXXXXXXXX"
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        color="teal"
                        error={fieldState.error?.message}
                        required
                      />
                    )}
                  />

                  {apiError && (
                    <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{apiError}</p>
                  )}

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      variant="outline"
                      color="neutral"
                      type="button"
                      onClick={handleClose}
                      disabled={requestKeyPending}
                    >
                      {t("common.cancel")}
                    </Button>
                    <Button
                      type="submit"
                      color="teal"
                      disabled={phoneForm.formState.isSubmitting || requestKeyPending}
                    >
                      {requestKeyPending ? t("support.sending") : t("profile.sendKey")}
                    </Button>
                  </div>
                </form>
              ) : (
                <form onSubmit={keyForm.handleSubmit(onKeySubmit)} className="flex flex-col gap-4">
                  <Controller
                    control={keyForm.control}
                    name="apiKey"
                    render={({ field, fieldState }) => (
                      <Input
                        label={t("profile.apiKey")}
                        type="text"
                        placeholder={prefillApiKey || "****************"}
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        color="teal"
                        error={fieldState.error?.message}
                        required
                      />
                    )}
                  />

                  {apiError && (
                    <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{apiError}</p>
                  )}

                  <div className="flex justify-end gap-2 pt-2">
                    {isNovaPost ? (
                      <Button
                        variant="outline"
                        color="neutral"
                        type="button"
                        onClick={handleBack}
                        disabled={connectPending}
                      >
                        {t("common.back")}
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        color="neutral"
                        type="button"
                        onClick={handleClose}
                        disabled={connectPending}
                      >
                        {t("common.cancel")}
                      </Button>
                    )}
                    <Button
                      type="submit"
                      color="teal"
                      disabled={keyForm.formState.isSubmitting || connectPending}
                    >
                      {connectPending ? t("profile.connecting") : t("profile.connect")}
                    </Button>
                  </div>
                </form>
              )}
            </>
          ) : (
            <>
              <Dialog.Description className="mb-6 text-sm text-neutral-500">
                {t("profile.operatorKeyStoredEncrypted")}
              </Dialog.Description>

              <form onSubmit={keyForm.handleSubmit(onKeySubmit)} className="flex flex-col gap-4">
                <Controller
                  control={keyForm.control}
                  name="apiKey"
                  render={({ field, fieldState }) => (
                    <Input
                      label={t("profile.apiKey")}
                      type="password"
                      placeholder="****************"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      color="teal"
                      error={fieldState.error?.message}
                      required
                    />
                  )}
                />

                {isNovaPost && (
                  <a
                    href="https://my.novaposhta.ua/settings/index#apikeys"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-teal-700 hover:underline"
                  >
                    {t("profile.whereToFindApiKey")} →
                  </a>
                )}

                {apiError && (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{apiError}</p>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    color="neutral"
                    type="button"
                    onClick={handleClose}
                    disabled={updatePending}
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button
                    type="submit"
                    color="teal"
                    disabled={keyForm.formState.isSubmitting || updatePending}
                  >
                    {updatePending ? t("common.saving") : t("common.save")}
                  </Button>
                </div>
              </form>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
