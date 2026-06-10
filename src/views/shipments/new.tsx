import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { APP_ROUTES } from "@/constants/app-routes";
import { Button } from "@/components/Button";
import { ToggleGroup, ToggleGroupItem } from "@/components/Toggle";
import { Input } from "@/components/Input";
import {
  useCreateShipmentMutation,
  useUpdateMeestShipmentMutation,
  useUpdateNovaPoshtaShipmentMutation,
  useUpdateUkrposhtaShipmentMutation,
} from "@/api/shipments";
import {
  useCreateDraftMutation,
  useDraftQuery,
  useUpdateDraftMutation,
} from "@/api/drafts";
import {
  ConnectionInvalidError,
  OperatorUnavailableError,
  usePostalConnectionsQuery,
} from "@/api/postal-connections";
import { ApiValidationError } from "@/utils/parseApiError";
import { useToast } from "@/components/Toast/use-toast";
import { SaveAsTemplateModal } from "@/components/SaveAsTemplateModal";
import { CancelGuardModal } from "@/components/CancelGuardModal";
import { useRecipientsQuery } from "@/api/recipients";
import {
  useTemplateQuery,
  useIncrementTemplateUsageMutation,
} from "@/api/templates";
import type { Recipient } from "@/types/recipient";
import { normalizeUaPhone } from "@/utils/validation";
import {
  DEFAULT_SHIPMENT_FORM_DATA,
  POSTAL_SERVICE_MODE_REQUIREMENTS,
  mapShipmentSourceToFormData,
  normalizePostalServiceMode,
  serializeShipmentFormDataForTemplate,
  type ShipmentFormData,
} from "@/utils/shipmentFormData";

function createShipmentSchema(
  t: (key: string, options?: Record<string, unknown>) => string,
) {
  const addressPartsSchema = z.object({
    city: z.string().optional(),
    street: z.string().optional(),
    building: z.string().optional(),
    flat: z.string().optional(),
    postCode: z.string().optional(),
    region: z.string().optional(),
  });

  const personSchema = z.object({
    name: z
      .string()
      .min(1, t("shipmentForm.validation.required"))
      .max(100, t("shipmentForm.validation.nameMax")),
    phone: z.string(),
    countryCode: z
      .string()
      .length(2, t("shipmentForm.validation.countryCodeLength")),
    companyTin: z.string().max(20).optional(),
    companyName: z.string().max(100).optional(),
    eoriCode: z.string().min(3).max(17).optional(),
    email: z.union([z.string().email(), z.literal("")]).optional(),
    divisionNumber: z.string().optional(),
    divisionID: z.number().int().positive().optional(),
    city: z.string().optional(),
    address: z.string().optional(),
    postalCode: z.string().optional(),
    addressParts: addressPartsSchema.optional(),
  });

  const senderPersonSchema = personSchema.extend({
    ioss: z.string().max(12).optional(),
  });

  const invoiceItemSchema = z.object({
    id: z.string().optional(),
    hsCode: z.string().optional(),
    name: z.string().optional(),
    nameEng: z.string().optional(),
    materialEng: z.string().optional(),
    madeInCountryCode: z.string().length(2).optional(),
    measurementCode: z.string().optional(),
    amount: z.number().min(0, t("shipmentForm.validation.nonNegative")).optional(),
    cost: z.number().min(0, t("shipmentForm.validation.nonNegative")).optional(),
    actualWeight: z
      .number()
      .min(0, t("shipmentForm.validation.nonNegative"))
      .optional(),
  });

  const parcelSchema = z.object({
    cargoCategory: z.enum(["parcel", "documents", "pallet"]),
    rowNumber: z.number().int().positive().optional(),
    parcelDescription: z
      .string()
      .min(1, t("shipmentForm.validation.required"))
      .max(255, t("shipmentForm.validation.descriptionMax")),
    insuranceCost: z
      .number()
      .min(0, t("shipmentForm.validation.nonNegative")),
    insuranceCurrencyCode: z.string().length(3).optional(),
    actualWeight: z
      .number()
      .min(0, t("shipmentForm.validation.nonNegative")),
    dimensions: z.object({
      length: z.number().min(0, t("shipmentForm.validation.nonNegative")),
      width: z.number().min(0, t("shipmentForm.validation.nonNegative")),
      height: z.number().min(0, t("shipmentForm.validation.nonNegative")),
    }),
  });

  return z.object({
      postalServiceMode: z.enum(["nova-poshta", "ukrposhta", "meest"]),
      status: z.enum(["ReadyToShip"]).optional(),
      payerType: z.enum(["Sender", "Recipient", "ThirdPerson"]),
      payerContractNumber: z.string().max(20).optional(),
      clientOrder: z.string().max(50).optional(),
      note: z.string().max(255).optional(),
      deliveryType: z.enum(["", "standard", "economy", "express"]).optional(),
      readyToShip: z.boolean().optional(),
      sender: senderPersonSchema,
      recipient: personSchema,
      parcel: parcelSchema,
      parcels: z.array(z.object({
        rowNumber: z.number().int().positive(),
        cargoCategory: z.enum(["parcel", "documents", "pallet"]),
        parcelDescription: z
          .string()
          .min(1, t("shipmentForm.validation.required"))
          .max(255, t("shipmentForm.validation.descriptionMax")),
        insuranceCost: z
          .number()
          .min(0, t("shipmentForm.validation.nonNegative")),
        insuranceCurrencyCode: z.string().length(3).optional(),
        length: z.number().min(0, t("shipmentForm.validation.nonNegative")),
        width: z.number().min(0, t("shipmentForm.validation.nonNegative")),
        height: z.number().min(0, t("shipmentForm.validation.nonNegative")),
        actualWeight: z
          .number()
          .min(0, t("shipmentForm.validation.nonNegative")),
      })).optional(),
      invoice: z.object({
        cost: z.number().min(0, t("shipmentForm.validation.nonNegative")),
        currency: z
          .string()
          .length(3, t("shipmentForm.validation.currencyLength")),
        customerNumber: z.string().max(50).optional(),
        customerCreatedAt: z.string().optional(),
        type: z.enum(["Invoice", "ProformaInvoice"]).optional(),
        incoterm: z.enum(["DAP", "DDP"]).optional(),
        exportReason: z
          .enum(["ForPersonalPurposes", "Selling", "Repair", "Return", "Other"])
          .optional(),
        payerFeesCustoms: z
          .enum(["Sender", "Recipient", "ThirdPerson"])
          .optional(),
        items: z.array(invoiceItemSchema).optional(),
      }),
    })
    .superRefine((values, ctx) => {
      const requirements =
        POSTAL_SERVICE_MODE_REQUIREMENTS[values.postalServiceMode];

      function requireText(
        path: (string | number)[],
        value: string | undefined,
      ) {
        if (!value?.trim()) {
          ctx.addIssue({
            code: "custom",
            path,
            message: t("shipmentForm.validation.required"),
          });
        }
      }

      function requirePositive(
        path: (string | number)[],
        value: number,
        message?: string,
      ) {
        if (value <= 0) {
          ctx.addIssue({
            code: "custom",
            path,
            message: message ?? t("shipmentForm.validation.positive"),
          });
        }
      }

      (["sender", "recipient"] as const).forEach((party) => {
        const addressParts = values[party].addressParts;
        const hasAddressParts = Boolean(
          addressParts?.city?.trim() &&
            addressParts?.street?.trim() &&
            addressParts?.building?.trim() &&
            addressParts?.postCode?.trim(),
        );

        if (values.postalServiceMode === "nova-poshta") {
          if (!values[party].divisionNumber?.trim() && !hasAddressParts) {
            ctx.addIssue({
              code: "custom",
              path: [party, "divisionNumber"],
              message: t("shipmentForm.validation.required"),
            });
          }
        } else if (requirements.division) {
          requireText([party, "divisionNumber"], values[party].divisionNumber);
        }

        if (requirements.city) requireText([party, "city"], values[party].city);
        if (requirements.address)
          requireText([party, "address"], values[party].address);
        if (requirements.postalCode)
          requireText([party, "postalCode"], values[party].postalCode);
      });

      const requiresNovaDeliveryType =
        values.postalServiceMode === "nova-poshta" &&
        (values.sender.countryCode !== "UA" ||
          values.recipient.countryCode !== "UA" ||
          Boolean(values.sender.addressParts || values.recipient.addressParts));

      if (requiresNovaDeliveryType && !values.deliveryType) {
        ctx.addIssue({
          code: "custom",
          path: ["deliveryType"],
          message: t("shipmentForm.validation.deliveryTypeRequired"),
        });
      }

      requirePositive(["parcel", "actualWeight"], values.parcel.actualWeight);

      if (requirements.dimensions) {
        requirePositive(
          ["parcel", "dimensions", "length"],
          values.parcel.dimensions.length,
          t("shipmentForm.validation.dimensionLength"),
        );
        requirePositive(
          ["parcel", "dimensions", "width"],
          values.parcel.dimensions.width,
          t("shipmentForm.validation.dimensionWidth"),
        );
        requirePositive(
          ["parcel", "dimensions", "height"],
          values.parcel.dimensions.height,
          t("shipmentForm.validation.dimensionHeight"),
        );
      }

      if (requirements.insurance) {
        requirePositive(
          ["parcel", "insuranceCost"],
          values.parcel.insuranceCost,
        );
      }

      if (values.payerType === "ThirdPerson") {
        requireText(["payerContractNumber"], values.payerContractNumber);
        if (
          values.payerContractNumber &&
          values.payerContractNumber.length < 2
        ) {
          ctx.addIssue({
            code: "custom",
            path: ["payerContractNumber"],
            message: t("shipmentForm.validation.payerContractMin"),
          });
        }
      }
    });
}

type FormValues = z.infer<ReturnType<typeof createShipmentSchema>>;

function normalizePhone(raw: string): string {
  return normalizeUaPhone(raw);
}

function formatRecipientDisplayName(recipient: Recipient): string {
  if (recipient.type === "ORGANIZATION") {
    return (
      recipient.companyName?.trim() ||
      [recipient.lastName, recipient.firstName]
        .filter(Boolean)
        .join(" ")
        .trim() ||
      recipient.phone
    );
  }

  return (
    [recipient.lastName, recipient.firstName, recipient.patronymic]
      .filter(Boolean)
      .join(" ")
      .trim() || recipient.phone
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="mb-4 border-b border-neutral-200 pb-2">
      <h2 className="text-base font-semibold text-neutral-800">{title}</h2>
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-600">{message}</p>;
}

function FormLabel({
  children,
  required,
  optionalLabel,
}: {
  children: ReactNode;
  required?: boolean;
  optionalLabel: string;
}) {
  return (
    <label className="mb-1.5 block text-sm font-medium text-neutral-700">
      {children}
      {!required ? (
        <span className="ml-1 font-normal text-neutral-400">
          ({optionalLabel})
        </span>
      ) : null}
    </label>
  );
}

function SelectField({
  label,
  options,
  error,
  required,
  optionalLabel,
  ...props
}: {
  label: string;
  options: { value: string; label: string }[];
  error?: string;
  required?: boolean;
  optionalLabel: string;
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div>
      <FormLabel required={required} optionalLabel={optionalLabel}>
        {label}
      </FormLabel>
      <select
        {...props}
        className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <FieldError message={error} />
    </div>
  );
}

export default function ShipmentNewView() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { mutateAsync: createShipment, isPending } =
    useCreateShipmentMutation();
  const { mutateAsync: updateNovaPoshta, isPending: isUpdatingNovaPoshta } =
    useUpdateNovaPoshtaShipmentMutation();
  const { mutateAsync: updateUkrposhta, isPending: isUpdatingUkrposhta } =
    useUpdateUkrposhtaShipmentMutation();
  const { mutateAsync: updateMeest, isPending: isUpdatingMeest } =
    useUpdateMeestShipmentMutation();
  const { data: recipientsData, isLoading: recipientsLoading } =
    useRecipientsQuery({
      page: 1,
      limit: 100,
      sortBy: "createdAt",
      sortOrder: "desc",
    });
  const { data: postalConnectionsData } = usePostalConnectionsQuery();
  const duplicateTtn = searchParams.get("duplicate")?.trim() ?? "";
  const editTtn = searchParams.get("editTtn")?.trim() ?? "";
  const operatorParam = searchParams.get("operator");
  const draftIdParam = searchParams.get("draftId");
  const draftId = draftIdParam ? Number(draftIdParam) : NaN;
  const activeDraftId = Number.isInteger(draftId) && draftId > 0 ? draftId : 0;
  const templateIdParam = searchParams.get("templateId");
  const activeTemplateId = templateIdParam ? Number(templateIdParam) : 0;
  const sourceShipmentTtn = editTtn || duplicateTtn;
  const isShipmentEditMode = Boolean(editTtn);
  const isDuplicateMode = Boolean(duplicateTtn);
  const isDraftMode = Boolean(activeDraftId);
  const { data: draftPrefill, isLoading: isDraftPrefillLoading } =
    useDraftQuery(activeDraftId);
  const shipmentPrefillFromState = (
    location.state as { shipmentPrefillData?: Record<string, unknown> } | null
  )?.shipmentPrefillData;

  const cargoCategories = [
    { value: "parcel", label: t("shipmentForm.cargoCategory.parcel") },
    { value: "documents", label: t("shipmentForm.cargoCategory.documents") },
    { value: "pallet", label: t("shipmentForm.cargoCategory.pallet") },
  ];
  const payerTypes = [
    { value: "Sender", label: t("shipmentForm.payerType.sender") },
    { value: "Recipient", label: t("shipmentForm.payerType.recipient") },
    { value: "ThirdPerson", label: t("shipmentForm.payerType.thirdPerson") },
  ];
  const deliveryTypes = [
    { value: "", label: "—" },
    { value: "standard", label: t("shipmentForm.deliveryType.standard") },
    { value: "economy", label: t("shipmentForm.deliveryType.economy") },
    { value: "express", label: t("shipmentForm.deliveryType.express") },
  ];
  const postalServiceModes = [
    {
      value: "nova-poshta",
      label: "Nova Post",
      description: t("shipmentForm.modeDescription.novaPost"),
    },
    {
      value: "ukrposhta",
      label: "Ukrposhta",
      description: t("shipmentForm.modeDescription.ukrposhta"),
    },
    {
      value: "meest",
      label: "Meest",
      description: t("shipmentForm.modeDescription.meest"),
    },
  ] as const;

  const form = useForm<FormValues>({
    resolver: zodResolver(createShipmentSchema(t)),
    defaultValues: DEFAULT_SHIPMENT_FORM_DATA,
  });

  const {
    register,
    handleSubmit,
    getValues,
    control,
    formState: { errors, isDirty },
  } = form;

  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [manualGuardOpen, setManualGuardOpen] = useState(false);
  const [selectedRecipientId, setSelectedRecipientId] = useState("");
  const { mutateAsync: createDraft, isPending: isDraftPending } =
    useCreateDraftMutation();
  const { mutateAsync: updateDraft, isPending: isDraftUpdating } =
    useUpdateDraftMutation();
  const { mutateAsync: incrementTemplateUsage } =
    useIncrementTemplateUsageMutation();
  const { data: templatePrefill, isLoading: isTemplatePrefillLoading } =
    useTemplateQuery(activeTemplateId);
  const appliedPrefillKeyRef = useRef<string | null>(null);

  const selectedMode = useWatch({ control, name: "postalServiceMode" });
  const payerType = useWatch({ control, name: "payerType" });
  const dimLength = useWatch({ control, name: "parcel.dimensions.length" });
  const dimWidth = useWatch({ control, name: "parcel.dimensions.width" });
  const dimHeight = useWatch({ control, name: "parcel.dimensions.height" });
  const parcelVolume =
    dimLength > 0 && dimWidth > 0 && dimHeight > 0
      ? dimLength * dimWidth * dimHeight
      : 0;
  const selectedModeConfig =
    postalServiceModes.find((mode) => mode.value === selectedMode) ??
    postalServiceModes[0];
  const modeRequirements =
    POSTAL_SERVICE_MODE_REQUIREMENTS[selectedModeConfig.value];
  const isSubmitting =
    isPending ||
    isDraftPending ||
    isDraftUpdating ||
    isUpdatingNovaPoshta ||
    isUpdatingUkrposhta ||
    isUpdatingMeest;
  const recipients = recipientsData?.items ?? [];
  const selectedPostalServiceId =
    postalConnectionsData?.connections.find(
      (connection) =>
        normalizePostalServiceMode(connection.postalService.slug) ===
        selectedMode,
    )?.postalService.id ?? 0;
  const activePrefillKey = useMemo(() => {
    if (activeTemplateId) return `template:${activeTemplateId}`;
    if (activeDraftId) return `draft:${activeDraftId}`;
    if (editTtn) return `edit:${editTtn}`;
    if (duplicateTtn) return `duplicate:${duplicateTtn}`;
    return null;
  }, [activeTemplateId, activeDraftId, duplicateTtn, editTtn]);
  const isPrefillLoading =
    (Boolean(activeDraftId) && isDraftPrefillLoading) ||
    (Boolean(activeTemplateId) && isTemplatePrefillLoading);
  const pageTitle = isShipmentEditMode
    ? t("shipmentForm.editShipment")
    : isDuplicateMode
      ? t("shipmentForm.duplicateShipment")
      : isDraftMode
        ? t("shipmentForm.editDraft")
        : t("shipmentForm.newShipment");
  const pageDescription = isShipmentEditMode
    ? t("shipmentForm.editShipmentDescription", {
        operator: selectedModeConfig.label,
      })
    : isDuplicateMode
      ? t("shipmentForm.duplicateShipmentDescription", {
          operator: selectedModeConfig.label,
        })
      : isDraftMode
        ? t("shipmentForm.editDraftDescription", {
            operator: selectedModeConfig.label,
          })
        : t("shipmentForm.newShipmentDescription", {
            operator: selectedModeConfig.label,
          });
  const submitLabel = isShipmentEditMode
    ? t("shipmentForm.updateShipment")
    : isPending ||
        isUpdatingNovaPoshta ||
        isUpdatingUkrposhta ||
        isUpdatingMeest
      ? t("shipmentForm.saving")
      : t("shipmentForm.createShipment");

  useEffect(() => {
    if (!isDirty) return;

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    if (!activePrefillKey || appliedPrefillKeyRef.current === activePrefillKey)
      return;

    if (activeTemplateId && templatePrefill) {
      const nextValues = mapShipmentSourceToFormData({
        ...templatePrefill.templateData,
        postalServiceMode: templatePrefill.postalService.slug,
      });
      console.debug("[ShipmentPrefill] applying template", {
        activePrefillKey,
        templateId: activeTemplateId,
        templatePrefill,
        nextValues,
      });
      form.reset(nextValues);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedRecipientId("");
      appliedPrefillKeyRef.current = activePrefillKey;
      incrementTemplateUsage(activeTemplateId).catch(() => {});
      return;
    }

    if (activeDraftId && draftPrefill?.draftData) {
      const nextValues = mapShipmentSourceToFormData(
        draftPrefill.draftData as Record<string, unknown>,
        draftPrefill.draftData?.postalServiceMode as string | undefined,
      );
      console.debug("[ShipmentPrefill] applying draft", {
        activePrefillKey,
        draftId: activeDraftId,
        draftPrefill,
        nextValues,
      });
      form.reset(nextValues);
      setSelectedRecipientId("");
      appliedPrefillKeyRef.current = activePrefillKey;
      return;
    }

    if (sourceShipmentTtn && shipmentPrefillFromState) {
      const nextValues = mapShipmentSourceToFormData(
        shipmentPrefillFromState,
        operatorParam,
      );
      console.debug("[ShipmentPrefill] applying shipment", {
        activePrefillKey,
        sourceShipmentTtn,
        operatorParam,
        shipmentPrefillFromState,
        nextValues,
      });
      form.reset(nextValues);
      setSelectedRecipientId("");
      appliedPrefillKeyRef.current = activePrefillKey;
    }
  }, [
    activeTemplateId,
    templatePrefill,
    activeDraftId,
    activePrefillKey,
    draftPrefill,
    form,
    incrementTemplateUsage,
    operatorParam,
    shipmentPrefillFromState,
    sourceShipmentTtn,
  ]);

  useEffect(() => {
    if (!activePrefillKey) return;

    console.debug("[ShipmentPrefill] route state", {
      activePrefillKey,
      activeTemplateId,
      activeDraftId,
      sourceShipmentTtn,
      isDraftPrefillLoading,
      isTemplatePrefillLoading,
      shipmentPrefillFromState,
      draftPrefill,
      templatePrefill,
    });
  }, [
    activeDraftId,
    activePrefillKey,
    activeTemplateId,
    draftPrefill,
    isDraftPrefillLoading,
    isTemplatePrefillLoading,
    shipmentPrefillFromState,
    sourceShipmentTtn,
    templatePrefill,
  ]);

  function handleRecipientSelect(recipientId: string) {
    setSelectedRecipientId(recipientId);
    if (!recipientId) return;

    const recipient = recipients.find(
      (item) => item.id === Number(recipientId),
    );
    if (!recipient) return;

    form.setValue("recipient.name", formatRecipientDisplayName(recipient), {
      shouldDirty: true,
      shouldTouch: true,
    });
    form.setValue("recipient.phone", normalizePhone(recipient.phone), {
      shouldDirty: true,
      shouldTouch: true,
    });

    if (
      recipient.address?.type === "BRANCH" &&
      recipient.address.branchNumber
    ) {
      form.setValue(
        "recipient.divisionNumber",
        recipient.address.branchNumber,
        {
          shouldDirty: true,
          shouldTouch: true,
        },
      );
    }
  }

  async function handleDiscard() {
    setManualGuardOpen(false);
    navigate(APP_ROUTES.shipments);
  }

  async function handleSaveDraft() {
    try {
      if (activeDraftId) {
        await updateDraft({
          id: activeDraftId,
          body: { draftData: getValues() as Record<string, unknown> },
        });
      } else {
        await createDraft({
          draftData: getValues() as Record<string, unknown>,
        });
      }
      toast({ title: t("shipmentForm.draftSaved"), color: "success" });
      setManualGuardOpen(false);
      navigate(APP_ROUTES.shipments);
    } catch {
      toast({ title: t("shipmentForm.failedToSaveDraft"), color: "error" });
    }
  }

  async function onSubmit(values: FormValues) {
    const senderPhone = normalizePhone(values.sender.phone);
    const recipientPhone = normalizePhone(values.recipient.phone);
    try {
      if (
        values.postalServiceMode === "ukrposhta" ||
        values.postalServiceMode === "meest"
      ) {
        const simpleBody = {
          operator: values.postalServiceMode as "ukrposhta" | "meest",
          sender: { name: values.sender.name, phone: senderPhone },
          recipient: {
            name: values.recipient.name,
            phone: recipientPhone,
            address: values.recipient.address ?? "",
            city: values.recipient.city ?? "",
          },
          weight: Math.round(values.parcel.actualWeight * 1000),
          declaredValue: values.invoice.cost,
          description: values.parcel.parcelDescription || undefined,
          draftId: activeDraftId || undefined,
        };
        if (isShipmentEditMode && editTtn) {
          const updateFn =
            values.postalServiceMode === "ukrposhta"
              ? updateUkrposhta
              : updateMeest;
          const { operator: _op, ...updateBody } = simpleBody;
          await updateFn({ ttn: editTtn, body: updateBody });
        } else {
          await createShipment(simpleBody);
        }
        toast({
          title: isShipmentEditMode
            ? t("shipmentForm.shipmentUpdated")
            : t("shipmentForm.shipmentCreated"),
          color: "success",
        });
        navigate(APP_ROUTES.shipments);
        return;
      }

      const novaPostBody = {
        payerType: values.payerType,
        payerContractNumber: values.payerContractNumber || undefined,
        clientOrder: values.clientOrder || undefined,
        note: values.note || undefined,
        deliveryType: values.deliveryType ? values.deliveryType : undefined,
        status: values.readyToShip ? ("ReadyToShip" as const) : undefined,
        sender: {
          name: values.sender.name,
          phone: senderPhone,
          countryCode: values.sender.countryCode,
          divisionNumber: values.sender.divisionNumber || undefined,
        },
        recipient: {
          name: values.recipient.name,
          phone: recipientPhone,
          countryCode: values.recipient.countryCode,
          divisionNumber: values.recipient.divisionNumber || undefined,
        },
        parcels: [
          {
            rowNumber: 1,
            cargoCategory: values.parcel.cargoCategory as
              | "parcel"
              | "documents"
              | "pallet",
            parcelDescription: values.parcel.parcelDescription,
            actualWeight: Math.round(values.parcel.actualWeight * 1000),
            length: Math.round(values.parcel.dimensions.length * 10),
            width: Math.round(values.parcel.dimensions.width * 10),
            height: Math.round(values.parcel.dimensions.height * 10),
            insuranceCost: values.parcel.insuranceCost,
          },
        ],
        invoice:
          values.invoice.cost > 0
            ? { cost: values.invoice.cost, currency: values.invoice.currency }
            : undefined,
        draftId: activeDraftId || undefined,
      };
      const result =
        isShipmentEditMode && editTtn
          ? await updateNovaPoshta({ ttn: editTtn, body: novaPostBody })
          : await createShipment({
              ...novaPostBody,
              operator: "nova-post" as const,
            });
      const scheduledDeliveryDate =
        "scheduledDeliveryDate" in result ? result.scheduledDeliveryDate : null;
      toast({
        title: isShipmentEditMode
          ? t("shipmentForm.shipmentUpdated")
          : t("shipmentForm.shipmentCreated"),
        description: scheduledDeliveryDate
          ? t("shipmentForm.estimatedDelivery", {
              date: new Date(scheduledDeliveryDate).toLocaleDateString(),
            })
          : undefined,
        color: "success",
      });
      navigate(APP_ROUTES.shipments);
    } catch (err) {
      if (err instanceof ConnectionInvalidError) {
        toast({
          title: t("shipmentForm.connectionInvalidTitle"),
          description: t("shipmentForm.connectionInvalidDescription"),
          color: "error",
        });
      } else if (err instanceof OperatorUnavailableError) {
        toast({
          title: t("shipmentForm.operatorUnavailableTitle"),
          description: t("shipmentForm.operatorUnavailableDescription"),
          color: "error",
        });
      } else if (
        err instanceof ApiValidationError &&
        err.validationDetails.length > 0
      ) {
        toast({
          title: err.message,
          description: err.validationDetails.join("\n"),
          color: "error",
        });
      } else {
        toast({
          title: t("shipmentForm.failedToCreate"),
          description:
            err instanceof Error ? err.message : t("shipmentForm.tryAgain"),
          color: "error",
        });
      }
    }
  }

  if (isPrefillLoading) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="mb-1 text-2xl font-semibold text-neutral-900">
          {pageTitle}
        </h1>
        <p className="text-sm text-neutral-500">
          {t("shipmentForm.loadingShipmentData")}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="mb-1 text-2xl font-semibold text-neutral-900">
        {pageTitle}
      </h1>
      <p className="mb-8 text-sm text-neutral-500">{pageDescription}</p>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8">
        <section>
          <SectionHeader title={t("shipmentForm.sections.postalService")} />
          <div>
            <FormLabel required optionalLabel={t("shipmentForm.optional")}>
              {t("shipmentForm.fields.mode")}
            </FormLabel>
            <ToggleGroup
              type="single"
              value={selectedMode}
              onValueChange={(value) => {
                if (value)
                  form.setValue(
                    "postalServiceMode",
                    value as FormValues["postalServiceMode"],
                    { shouldValidate: true },
                  );
              }}
              disabled={isShipmentEditMode}
              variant="outline"
              color="teal"
              className="mt-1.5 w-full"
            >
              {postalServiceModes.map(({ value, label }) => (
                <ToggleGroupItem key={value} value={value} className="flex-1">
                  {label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <FieldError message={errors.postalServiceMode?.message} />
          </div>
          <p className="mt-2 text-sm text-neutral-500">
            {selectedModeConfig.description}
          </p>
        </section>

        {selectedMode === "nova-poshta" ? (
          <section>
            <SectionHeader title={t("shipmentForm.sections.shippingDetails")} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <SelectField
                label={t("shipmentForm.fields.payer")}
                options={payerTypes}
                required
                optionalLabel={t("shipmentForm.optional")}
                error={errors.payerType?.message}
                {...register("payerType")}
              />
              {payerType === "ThirdPerson" ? (
                <div>
                  <FormLabel
                    required
                    optionalLabel={t("shipmentForm.optional")}
                  >
                    {t("shipmentForm.fields.contractNumber")}
                  </FormLabel>
                  <Input
                    {...register("payerContractNumber")}
                    placeholder={t("shipmentForm.placeholders.contractNumber")}
                    error={errors.payerContractNumber?.message}
                  />
                </div>
              ) : null}
              <SelectField
                label={t("shipmentForm.fields.deliveryType")}
                options={deliveryTypes}
                required
                optionalLabel={t("shipmentForm.optional")}
                error={errors.deliveryType?.message}
                {...register("deliveryType")}
              />
              <div>
                <FormLabel optionalLabel={t("shipmentForm.optional")}>
                  {t("shipmentForm.fields.clientOrder")}
                </FormLabel>
                <Input
                  {...register("clientOrder")}
                  placeholder={t("shipmentForm.placeholders.clientOrder")}
                  error={errors.clientOrder?.message}
                />
              </div>
              <div className="sm:col-span-2">
                <FormLabel optionalLabel={t("shipmentForm.optional")}>
                  {t("shipmentForm.fields.note")}
                </FormLabel>
                <Input
                  {...register("note")}
                  placeholder={t("shipmentForm.placeholders.note")}
                  error={errors.note?.message}
                />
              </div>
            </div>
          </section>
        ) : null}
        <section>
          <SectionHeader title={t("shipmentForm.sections.sender")} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <FormLabel required optionalLabel={t("shipmentForm.optional")}>
                {t("shipmentForm.fields.fullName")}
              </FormLabel>
              <Input
                {...register("sender.name")}
                placeholder={t("shipmentForm.placeholders.senderName")}
                error={errors.sender?.name?.message}
              />
            </div>
            <div>
              <FormLabel required optionalLabel={t("shipmentForm.optional")}>
                {t("shipmentForm.fields.phone")}
              </FormLabel>
              <Input
                {...register("sender.phone")}
                placeholder={t("shipmentForm.placeholders.senderPhone")}
                error={errors.sender?.phone?.message}
              />
            </div>
            {modeRequirements.division ? (
              <div>
                <FormLabel required optionalLabel={t("shipmentForm.optional")}>
                  {t("shipmentForm.fields.divisionNumber")}
                </FormLabel>
                <Input
                  {...register("sender.divisionNumber")}
                  placeholder={t("shipmentForm.placeholders.senderDivision")}
                  error={errors.sender?.divisionNumber?.message}
                />
              </div>
            ) : null}
            {modeRequirements.city ? (
              <div>
                <FormLabel required optionalLabel={t("shipmentForm.optional")}>
                  {t("shipmentForm.fields.city")}
                </FormLabel>
                <Input
                  {...register("sender.city")}
                  placeholder={t("shipmentForm.placeholders.senderCity")}
                  error={errors.sender?.city?.message}
                />
              </div>
            ) : null}
            {modeRequirements.address ? (
              <div>
                <FormLabel required optionalLabel={t("shipmentForm.optional")}>
                  {t("shipmentForm.fields.address")}
                </FormLabel>
                <Input
                  {...register("sender.address")}
                  placeholder={t("shipmentForm.placeholders.senderAddress")}
                  error={errors.sender?.address?.message}
                />
              </div>
            ) : null}
            {modeRequirements.postalCode ? (
              <div>
                <FormLabel required optionalLabel={t("shipmentForm.optional")}>
                  {t("shipmentForm.fields.postalCode")}
                </FormLabel>
                <Input
                  {...register("sender.postalCode")}
                  placeholder={t("shipmentForm.placeholders.senderPostalCode")}
                  error={errors.sender?.postalCode?.message}
                />
              </div>
            ) : null}
          </div>
          <input type="hidden" {...register("sender.countryCode")} />
        </section>

        <section>
          <SectionHeader title={t("shipmentForm.sections.recipient")} />
          <div className="mb-4">
            <FormLabel optionalLabel={t("shipmentForm.optional")}>
              {t("shipmentForm.fields.selectSavedRecipient")}
            </FormLabel>
            <select
              value={selectedRecipientId}
              onChange={(event) => handleRecipientSelect(event.target.value)}
              className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="">
                {recipientsLoading
                  ? t("shipmentForm.loadingRecipients")
                  : t("shipmentForm.manualEntry")}
              </option>
              {recipients.map((recipient) => (
                <option key={recipient.id} value={recipient.id}>
                  {formatRecipientDisplayName(recipient)}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <FormLabel required optionalLabel={t("shipmentForm.optional")}>
                {t("shipmentForm.fields.fullName")}
              </FormLabel>
              <Input
                {...register("recipient.name")}
                placeholder={t("shipmentForm.placeholders.recipientName")}
                error={errors.recipient?.name?.message}
              />
            </div>
            <div>
              <FormLabel required optionalLabel={t("shipmentForm.optional")}>
                {t("shipmentForm.fields.phone")}
              </FormLabel>
              <Input
                {...register("recipient.phone")}
                placeholder={t("shipmentForm.placeholders.recipientPhone")}
                error={errors.recipient?.phone?.message}
              />
            </div>
            {modeRequirements.division ? (
              <div>
                <FormLabel required optionalLabel={t("shipmentForm.optional")}>
                  {t("shipmentForm.fields.divisionNumber")}
                </FormLabel>
                <Input
                  {...register("recipient.divisionNumber")}
                  placeholder={t("shipmentForm.placeholders.recipientDivision")}
                  error={errors.recipient?.divisionNumber?.message}
                />
              </div>
            ) : null}
            {modeRequirements.city ? (
              <div>
                <FormLabel required optionalLabel={t("shipmentForm.optional")}>
                  {t("shipmentForm.fields.city")}
                </FormLabel>
                <Input
                  {...register("recipient.city")}
                  placeholder={t("shipmentForm.placeholders.recipientCity")}
                  error={errors.recipient?.city?.message}
                />
              </div>
            ) : null}
            {modeRequirements.address ? (
              <div>
                <FormLabel required optionalLabel={t("shipmentForm.optional")}>
                  {t("shipmentForm.fields.address")}
                </FormLabel>
                <Input
                  {...register("recipient.address")}
                  placeholder={t("shipmentForm.placeholders.recipientAddress")}
                  error={errors.recipient?.address?.message}
                />
              </div>
            ) : null}
            {modeRequirements.postalCode ? (
              <div>
                <FormLabel required optionalLabel={t("shipmentForm.optional")}>
                  {t("shipmentForm.fields.postalCode")}
                </FormLabel>
                <Input
                  {...register("recipient.postalCode")}
                  placeholder={t(
                    "shipmentForm.placeholders.recipientPostalCode",
                  )}
                  error={errors.recipient?.postalCode?.message}
                />
              </div>
            ) : null}
          </div>
          <input type="hidden" {...register("recipient.countryCode")} />
        </section>

        <section>
          <SectionHeader title={t("shipmentForm.sections.parcel")} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SelectField
              label={t("shipmentForm.fields.cargoCategory")}
              options={cargoCategories}
              required
              optionalLabel={t("shipmentForm.optional")}
              error={errors.parcel?.cargoCategory?.message}
              {...register("parcel.cargoCategory")}
            />
            <div>
              <FormLabel required optionalLabel={t("shipmentForm.optional")}>
                {t("shipmentForm.fields.description")}
              </FormLabel>
              <Input
                {...register("parcel.parcelDescription")}
                placeholder={t("shipmentForm.placeholders.parcelDescription")}
                error={errors.parcel?.parcelDescription?.message}
              />
            </div>
            <div>
              <FormLabel required optionalLabel={t("shipmentForm.optional")}>
                {t("shipmentForm.fields.weight")}
              </FormLabel>
              <Input
                {...register("parcel.actualWeight", { valueAsNumber: true })}
                type="number"
                step="0.001"
                min="0"
                placeholder={t("shipmentForm.placeholders.weight")}
                error={errors.parcel?.actualWeight?.message}
              />
            </div>
            {modeRequirements.insurance ? (
              <div>
                <FormLabel required optionalLabel={t("shipmentForm.optional")}>
                  {t("shipmentForm.fields.declaredValue")}
                </FormLabel>
                <Input
                  {...register("parcel.insuranceCost", { valueAsNumber: true })}
                  type="number"
                  step="1"
                  min="0"
                  placeholder={t("shipmentForm.placeholders.declaredValue")}
                  error={errors.parcel?.insuranceCost?.message}
                />
              </div>
            ) : null}
          </div>
          {modeRequirements.dimensions ? (
            <div className="mt-4">
              <FormLabel required optionalLabel={t("shipmentForm.optional")}>
                {t("shipmentForm.fields.dimensions")}
              </FormLabel>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Input
                  {...register("parcel.dimensions.length", {
                    valueAsNumber: true,
                  })}
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder={t("shipmentForm.placeholders.length")}
                  error={errors.parcel?.dimensions?.length?.message}
                  className="[appearance:textfield] [&::-webkit-inner-spin-button]:hidden [&::-webkit-outer-spin-button]:hidden"
                />
                <Input
                  {...register("parcel.dimensions.width", {
                    valueAsNumber: true,
                  })}
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder={t("shipmentForm.placeholders.width")}
                  error={errors.parcel?.dimensions?.width?.message}
                  className="[appearance:textfield] [&::-webkit-inner-spin-button]:hidden [&::-webkit-outer-spin-button]:hidden"
                />
                <Input
                  {...register("parcel.dimensions.height", {
                    valueAsNumber: true,
                  })}
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder={t("shipmentForm.placeholders.height")}
                  error={errors.parcel?.dimensions?.height?.message}
                  className="[appearance:textfield] [&::-webkit-inner-spin-button]:hidden [&::-webkit-outer-spin-button]:hidden"
                />
                <input
                  type="text"
                  readOnly
                  tabIndex={-1}
                  value={parcelVolume > 0 ? parcelVolume.toFixed(2) : ""}
                  placeholder={t("shipmentForm.placeholders.volume")}
                  className="h-9 w-full cursor-default rounded-md border border-neutral-200 bg-neutral-50 px-3 text-sm text-neutral-500 outline-none"
                />
              </div>
            </div>
          ) : null}
        </section>

        <section>
          <SectionHeader title={t("shipmentForm.sections.invoice")} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <FormLabel optionalLabel={t("shipmentForm.optional")}>
                {t("shipmentForm.fields.declaredCost")}
              </FormLabel>
              <Input
                {...register("invoice.cost", { valueAsNumber: true })}
                type="number"
                step="1"
                min="0"
                placeholder="0"
                error={errors.invoice?.cost?.message}
              />
            </div>
          </div>
          <input type="hidden" {...register("invoice.currency")} />
        </section>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            color="teal"
            className="flex-1"
            disabled={isSubmitting}
            onClick={() => setIsTemplateModalOpen(true)}
          >
            {t("shipmentForm.saveAsTemplate")}
          </Button>
          <Button
            type="button"
            variant="outline"
            color="neutral"
            className="flex-1"
            disabled={isSubmitting}
            onClick={() => {
              if (isDirty) setManualGuardOpen(true);
              else navigate(APP_ROUTES.shipments);
            }}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="submit"
            color="teal"
            className="flex-1"
            disabled={isSubmitting}
          >
            {submitLabel}
          </Button>
        </div>
      </form>

      <SaveAsTemplateModal
        open={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        operatorLabel={selectedModeConfig.label}
        postalServiceId={selectedPostalServiceId}
        cargoCategory={getValues("parcel.cargoCategory")}
        templateData={serializeShipmentFormDataForTemplate(
          getValues() as ShipmentFormData,
        )}
      />

      <CancelGuardModal
        open={manualGuardOpen}
        onClose={() => {
          setManualGuardOpen(false);
        }}
        onDiscard={handleDiscard}
        onSaveDraft={handleSaveDraft}
        isSavingDraft={isDraftPending}
      />
    </main>
  );
}
