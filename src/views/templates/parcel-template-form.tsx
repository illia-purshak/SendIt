import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { APP_ROUTES } from "@/constants/app-routes";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Spinner } from "@/components/Loader/Spinner";
import { useCreateTemplateMutation, useTemplateQuery, useUpdateTemplateMutation } from "@/api/templates";
import { usePostalConnectionsQuery } from "@/api/postal-connections";
import { toastStore } from "@/store/toastStore";
import type { ShipmentType } from "@/types/template";
import { isValidUaPhone, normalizeUaPhone } from "@/utils/validation";
import {
  DEFAULT_SHIPMENT_FORM_DATA,
  POSTAL_SERVICE_MODE_REQUIREMENTS,
  mapShipmentSourceToFormData,
  normalizePostalServiceMode,
  serializeShipmentFormDataForTemplate,
  type ShipmentFormData,
} from "@/utils/shipmentFormData";

function createTemplateSchema(t: (key: string) => string) {
  return z.object({
    name: z.string().min(1, t("templateForm.validation.nameRequired")).max(100, t("templateForm.validation.nameMax")),
    description: z.string().max(500, t("templateForm.validation.descriptionMax")).optional(),
    postalServiceId: z.number().min(1, t("templateForm.validation.postalServiceRequired")),
    shipmentType: z.enum(["DOCUMENT", "PACKAGE", "BOX", "CARGO", "PALLET", "UNKNOWN"]),
    postalServiceMode: z.enum(["nova-poshta", "ukrposhta", "meest"]),
    payerType: z.enum(["Sender", "Recipient", "ThirdPerson"]),
    payerContractNumber: z.string().optional(),
    clientOrder: z.string().optional(),
    note: z.string().optional(),
    deliveryType: z.enum(["", "standard", "economy", "express"]).optional(),
    readyToShip: z.boolean().optional(),
    sender: z.object({
      name: z.string().max(100).optional(),
      phone: z.string().optional(),
      countryCode: z.string().optional(),
      divisionNumber: z.string().optional(),
      city: z.string().optional(),
      address: z.string().optional(),
      postalCode: z.string().optional(),
    }),
    recipient: z.object({
      name: z.string().max(100).optional(),
      phone: z.string().optional(),
      countryCode: z.string().optional(),
      divisionNumber: z.string().optional(),
      city: z.string().optional(),
      address: z.string().optional(),
      postalCode: z.string().optional(),
    }),
    parcel: z.object({
      cargoCategory: z.enum(["", "parcel", "documents", "pallet"]),
      parcelDescription: z.string().max(255).optional(),
      actualWeight: z.number().min(0),
      insuranceCost: z.number().min(0),
      dimensions: z.object({
        length: z.number().min(0),
        width: z.number().min(0),
        height: z.number().min(0),
      }),
    }),
    invoice: z.object({
      cost: z.number().min(0),
      currency: z.string().optional(),
    }),
  }).superRefine((values, ctx) => {
    (["sender", "recipient"] as const).forEach((party) => {
      const phone = values[party].phone?.trim();
      if (phone && !isValidUaPhone(phone)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [party, "phone"],
          message: t("shipmentForm.validation.invalidPhone"),
        });
      }
    });
  });
}

type TemplateFormValues = z.infer<ReturnType<typeof createTemplateSchema>>;

function buildTemplateFormValues(defaultValues?: Partial<TemplateFormValues>): TemplateFormValues {
  return {
    name: "",
    description: "",
    postalServiceId: 0,
    shipmentType: "PACKAGE",
    ...DEFAULT_SHIPMENT_FORM_DATA,
    ...defaultValues,
    sender: {
      ...DEFAULT_SHIPMENT_FORM_DATA.sender,
      ...defaultValues?.sender,
    },
    recipient: {
      ...DEFAULT_SHIPMENT_FORM_DATA.recipient,
      ...defaultValues?.recipient,
    },
    parcel: {
      ...DEFAULT_SHIPMENT_FORM_DATA.parcel,
      ...defaultValues?.parcel,
      dimensions: {
        ...DEFAULT_SHIPMENT_FORM_DATA.parcel.dimensions,
        ...defaultValues?.parcel?.dimensions,
      },
    },
    invoice: {
      ...DEFAULT_SHIPMENT_FORM_DATA.invoice,
      ...defaultValues?.invoice,
    },
  };
}

export default function TemplateFormPage() {
  const { id: idParam } = useParams();
  const isEdit = Boolean(idParam);
  const templateId = idParam ? Number(idParam) : 0;

  const { data: template, isLoading } = useTemplateQuery(templateId);
  const formDefaultValues = useMemo(() => {
    if (!template) return undefined;

    const templateDataDefaults = template.templateData
      ? mapShipmentSourceToFormData(
          template.templateData as Record<string, unknown>,
          template.postalService.slug,
        )
      : undefined;

    return {
      name: template.name,
      description: template.description ?? "",
      postalServiceId: template.postalService.id,
      shipmentType: template.shipmentType,
      ...templateDataDefaults,
    };
  }, [template]);

  if (isEdit && isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <Spinner />
      </div>
    );
  }

  return <TemplateForm templateId={templateId} defaultValues={formDefaultValues} />;
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="mb-4 border-b border-neutral-200 pb-2">
      <h2 className="text-sm font-semibold text-neutral-700">{title}</h2>
    </div>
  );
}

function OptionalLabel({ children, optionalLabel }: { children: React.ReactNode; optionalLabel: string }) {
  return (
    <label className="mb-1.5 block text-sm font-medium text-neutral-700">
      {children}
      <span className="ml-1 font-normal text-neutral-400">({optionalLabel})</span>
    </label>
  );
}

function TemplateForm({
  templateId,
  defaultValues,
}: {
  templateId: number;
  defaultValues?: Partial<TemplateFormValues>;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isEdit = Boolean(defaultValues);

  const shipmentTypes: { value: ShipmentType; label: string }[] = [
    { value: "DOCUMENT", label: t("templateForm.shipmentType.document") },
    { value: "PACKAGE", label: t("templateForm.shipmentType.package") },
    { value: "BOX", label: t("templateForm.shipmentType.box") },
    { value: "CARGO", label: t("templateForm.shipmentType.cargo") },
    { value: "PALLET", label: t("templateForm.shipmentType.pallet") },
    { value: "UNKNOWN", label: t("templateForm.shipmentType.other") },
  ];

  const payerTypes = [
    { value: "Sender", label: t("templateForm.payerType.sender") },
    { value: "Recipient", label: t("templateForm.payerType.recipient") },
    { value: "ThirdPerson", label: t("templateForm.payerType.thirdPerson") },
  ];

  const deliveryTypes = [
    { value: "", label: t("templateForm.deliveryType.default") },
    { value: "standard", label: t("templateForm.deliveryType.standard") },
    { value: "economy", label: t("templateForm.deliveryType.economy") },
    { value: "express", label: t("templateForm.deliveryType.express") },
  ];

  const cargoCategories = [
    { value: "", label: t("templateForm.cargoCategory.select") },
    { value: "parcel", label: t("templateForm.cargoCategory.parcel") },
    { value: "documents", label: t("templateForm.cargoCategory.documents") },
    { value: "pallet", label: t("templateForm.cargoCategory.pallet") },
  ];

  const { data: connectionsData, isLoading: loadingConnections } = usePostalConnectionsQuery();
  const { mutateAsync: createTemplate, isPending: isCreating } = useCreateTemplateMutation();
  const { mutateAsync: updateTemplate, isPending: isUpdating } = useUpdateTemplateMutation();

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(createTemplateSchema(t)),
    defaultValues: buildTemplateFormValues(defaultValues),
  });

  const { register, handleSubmit, watch, reset, formState: { errors } } = form;
  const isPending = isCreating || isUpdating;

  useEffect(() => {
    console.debug("[TemplatePrefill] resetting form", {
      templateId,
      defaultValues,
    });
    reset(buildTemplateFormValues(defaultValues));
  }, [defaultValues, reset, templateId]);

  const connections = connectionsData?.connections ?? [];
  const watchedServiceId = watch("postalServiceId");
  const selectedConnection = connections.find(c => c.postalService.id === watchedServiceId);
  const operatorMode = normalizePostalServiceMode(selectedConnection?.postalService.slug);
  const modeRequirements = POSTAL_SERVICE_MODE_REQUIREMENTS[operatorMode];
  const hasService = watchedServiceId > 0;

  async function onSubmit(values: TemplateFormValues) {
    try {
      const templateData = serializeShipmentFormDataForTemplate({
        postalServiceMode: operatorMode,
        payerType: values.payerType,
        payerContractNumber: values.payerContractNumber ?? "",
        clientOrder: values.clientOrder ?? "",
        note: values.note ?? "",
        deliveryType: values.deliveryType ?? "",
        readyToShip: values.readyToShip ?? false,
        sender: {
          ...values.sender,
          phone: values.sender.phone ? normalizeUaPhone(values.sender.phone) : "",
        },
        recipient: {
          ...values.recipient,
          phone: values.recipient.phone ? normalizeUaPhone(values.recipient.phone) : "",
        },
        parcel: {
          ...values.parcel,
          cargoCategory: values.parcel.cargoCategory || DEFAULT_SHIPMENT_FORM_DATA.parcel.cargoCategory,
        },
        invoice: {
          cost: values.invoice.cost,
          currency: values.invoice.currency ?? DEFAULT_SHIPMENT_FORM_DATA.invoice.currency,
        },
      } satisfies ShipmentFormData);

      const body = {
        name: values.name,
        description: values.description || null,
        postalServiceId: values.postalServiceId,
        shipmentType: values.shipmentType,
        templateData,
      };

      if (isEdit) {
        await updateTemplate({ id: templateId, body });
        toastStore.toast({ title: t("templateForm.updated"), color: "success" });
      } else {
        await createTemplate(body);
        toastStore.toast({ title: t("templateForm.created"), color: "success" });
      }
      navigate(APP_ROUTES.templates);
    } catch (err) {
      toastStore.toast({
        title: t("templateForm.failedToSave"),
        description: err instanceof Error ? err.message : t("templateForm.tryAgain"),
        color: "error",
      });
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="mb-1 text-2xl font-semibold text-neutral-900">
        {isEdit ? t("templateForm.editTitle") : t("templateForm.newTitle")}
      </h1>
      <p className="mb-8 text-sm text-neutral-500">
        {isEdit ? t("templateForm.editDescription") : t("templateForm.newDescription")}
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">{t("templateForm.fields.name")}</label>
          <Input
            {...register("name")}
            placeholder={t("templateForm.placeholders.name")}
            error={errors.name?.message}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">
            {t("templateForm.fields.description")} <span className="font-normal text-neutral-400">({t("templateForm.optional")})</span>
          </label>
          <textarea
            {...register("description")}
            rows={3}
            placeholder={t("templateForm.placeholders.description")}
            className="w-full resize-none rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
          {errors.description && (
            <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">{t("templateForm.fields.postalService")}</label>
          {loadingConnections ? (
            <div className="h-10 w-full animate-pulse rounded-lg bg-neutral-100" />
          ) : connections.length === 0 ? (
            <p className="text-sm text-neutral-500">
              {t("templateForm.noPostalServices")}
            </p>
          ) : (
            <select
              {...register("postalServiceId", { valueAsNumber: true })}
              className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value={0} disabled>{t("templateForm.selectService")}</option>
              {connections.map((c) => (
                <option key={c.postalService.id} value={c.postalService.id}>
                  {c.postalService.name}
                </option>
              ))}
            </select>
          )}
          {errors.postalServiceId && (
            <p className="mt-1 text-xs text-red-600">{errors.postalServiceId.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">{t("templateForm.fields.shipmentType")}</label>
          <select
            {...register("shipmentType")}
            className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            {shipmentTypes.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        {hasService && (
          <>
            <p className="text-xs text-neutral-400">
              {t("templateForm.prefillHint")}
            </p>

            {operatorMode === "nova-poshta" && (
              <section className="rounded-lg border border-neutral-200 p-4">
                <SectionHeader title={t("templateForm.sections.shippingOptions")} />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <OptionalLabel optionalLabel={t("templateForm.optional")}>{t("templateForm.fields.payer")}</OptionalLabel>
                    <select
                      {...register("payerType")}
                      className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    >
                      {payerTypes.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <OptionalLabel optionalLabel={t("templateForm.optional")}>{t("templateForm.fields.deliveryType")}</OptionalLabel>
                    <select
                      {...register("deliveryType")}
                      className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    >
                      {deliveryTypes.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </section>
            )}

            <section className="rounded-lg border border-neutral-200 p-4">
              <SectionHeader title={t("templateForm.sections.sender")} />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <OptionalLabel optionalLabel={t("templateForm.optional")}>{t("templateForm.fields.senderName")}</OptionalLabel>
                  <Input {...register("sender.name")} placeholder={t("templateForm.placeholders.fullName")} />
                </div>
                <div>
                  <OptionalLabel optionalLabel={t("templateForm.optional")}>{t("templateForm.fields.senderPhone")}</OptionalLabel>
                  <Input {...register("sender.phone")} placeholder={t("templateForm.placeholders.phone")} />
                </div>
                {modeRequirements.division && (
                  <div>
                    <OptionalLabel optionalLabel={t("templateForm.optional")}>{t("templateForm.fields.divisionNumber")}</OptionalLabel>
                    <Input {...register("sender.divisionNumber")} placeholder={t("templateForm.placeholders.divisionNumber")} />
                  </div>
                )}
                {modeRequirements.city && (
                  <div>
                    <OptionalLabel optionalLabel={t("templateForm.optional")}>{t("templateForm.fields.city")}</OptionalLabel>
                    <Input {...register("sender.city")} placeholder={t("templateForm.placeholders.city")} />
                  </div>
                )}
                {modeRequirements.address && (
                  <div className="sm:col-span-2">
                    <OptionalLabel optionalLabel={t("templateForm.optional")}>{t("templateForm.fields.address")}</OptionalLabel>
                    <Input {...register("sender.address")} placeholder={t("templateForm.placeholders.address")} />
                  </div>
                )}
                {modeRequirements.postalCode && (
                  <div>
                    <OptionalLabel optionalLabel={t("templateForm.optional")}>{t("templateForm.fields.postalCode")}</OptionalLabel>
                    <Input {...register("sender.postalCode")} placeholder={t("templateForm.placeholders.postalCode")} />
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-lg border border-neutral-200 p-4">
              <SectionHeader title={t("templateForm.sections.recipient")} />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <OptionalLabel optionalLabel={t("templateForm.optional")}>{t("templateForm.fields.recipientName")}</OptionalLabel>
                  <Input {...register("recipient.name")} placeholder={t("templateForm.placeholders.fullName")} />
                </div>
                <div>
                  <OptionalLabel optionalLabel={t("templateForm.optional")}>{t("templateForm.fields.recipientPhone")}</OptionalLabel>
                  <Input {...register("recipient.phone")} placeholder={t("templateForm.placeholders.phone")} />
                </div>
                {modeRequirements.division && (
                  <div>
                    <OptionalLabel optionalLabel={t("templateForm.optional")}>{t("templateForm.fields.divisionNumber")}</OptionalLabel>
                    <Input {...register("recipient.divisionNumber")} placeholder={t("templateForm.placeholders.divisionNumber")} />
                  </div>
                )}
                {modeRequirements.city && (
                  <div>
                    <OptionalLabel optionalLabel={t("templateForm.optional")}>{t("templateForm.fields.city")}</OptionalLabel>
                    <Input {...register("recipient.city")} placeholder={t("templateForm.placeholders.city")} />
                  </div>
                )}
                {modeRequirements.address && (
                  <div className="sm:col-span-2">
                    <OptionalLabel optionalLabel={t("templateForm.optional")}>{t("templateForm.fields.address")}</OptionalLabel>
                    <Input {...register("recipient.address")} placeholder={t("templateForm.placeholders.address")} />
                  </div>
                )}
                {modeRequirements.postalCode && (
                  <div>
                    <OptionalLabel optionalLabel={t("templateForm.optional")}>{t("templateForm.fields.postalCode")}</OptionalLabel>
                    <Input {...register("recipient.postalCode")} placeholder={t("templateForm.placeholders.postalCode")} />
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-lg border border-neutral-200 p-4">
              <SectionHeader title={t("templateForm.sections.parcel")} />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <OptionalLabel optionalLabel={t("templateForm.optional")}>{t("templateForm.fields.cargoCategory")}</OptionalLabel>
                  <select
                    {...register("parcel.cargoCategory")}
                    className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    {cargoCategories.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <OptionalLabel optionalLabel={t("templateForm.optional")}>{t("templateForm.fields.weight")}</OptionalLabel>
                  <Input
                    {...register("parcel.actualWeight", { valueAsNumber: true })}
                    type="number"
                    step="0.001"
                    min="0"
                    placeholder={t("templateForm.placeholders.weight")}
                  />
                </div>
                <div className="sm:col-span-2">
                  <OptionalLabel optionalLabel={t("templateForm.optional")}>{t("templateForm.fields.parcelDescription")}</OptionalLabel>
                  <Input {...register("parcel.parcelDescription")} placeholder={t("templateForm.placeholders.parcelDescription")} />
                </div>
                {modeRequirements.dimensions && (
                  <div className="sm:col-span-2">
                    <OptionalLabel optionalLabel={t("templateForm.optional")}>{t("templateForm.fields.dimensions")}</OptionalLabel>
                    <div className="grid grid-cols-3 gap-3">
                      <Input
                        {...register("parcel.dimensions.length", { valueAsNumber: true })}
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder={t("templateForm.placeholders.length")}
                      />
                      <Input
                        {...register("parcel.dimensions.width", { valueAsNumber: true })}
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder={t("templateForm.placeholders.width")}
                      />
                      <Input
                        {...register("parcel.dimensions.height", { valueAsNumber: true })}
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder={t("templateForm.placeholders.height")}
                      />
                    </div>
                  </div>
                )}
                {modeRequirements.insurance && (
                  <div>
                    <OptionalLabel optionalLabel={t("templateForm.optional")}>{t("templateForm.fields.insuranceCost")}</OptionalLabel>
                    <Input
                      {...register("parcel.insuranceCost", { valueAsNumber: true })}
                      type="number"
                      step="1"
                      min="0"
                      placeholder="0"
                    />
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-lg border border-neutral-200 p-4">
              <SectionHeader title={t("templateForm.sections.invoice")} />
              <div className="max-w-xs">
                <OptionalLabel optionalLabel={t("templateForm.optional")}>{t("templateForm.fields.declaredCost")}</OptionalLabel>
                <Input
                  {...register("invoice.cost", { valueAsNumber: true })}
                  type="number"
                  step="1"
                  min="0"
                  placeholder="0"
                />
              </div>
            </section>
          </>
        )}

        <div className="mt-2 flex gap-3">
          <Button
            type="button"
            variant="outline"
            color="neutral"
            className="flex-1"
            disabled={isPending}
            onClick={() => navigate(APP_ROUTES.templates)}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="submit"
            color="teal"
            className="flex-1"
            disabled={isPending}
          >
            {isPending ? t("templateForm.saving") : isEdit ? t("templateForm.saveChanges") : t("templateForm.create")}
          </Button>
        </div>
      </form>
    </main>
  );
}
