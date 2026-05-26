import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useSearchParams } from "react-router-dom";
import { APP_ROUTES } from "@/constants/app-routes";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import {
  useCreateMeestShipmentMutation,
  useCreateNovaPoshtaShipmentMutation,
  useCreateUkrposhtaShipmentMutation,
  useShipmentByTtnQuery,
  useUpdateMeestShipmentMutation,
  useUpdateNovaPoshtaShipmentMutation,
  useUpdateUkrposhtaShipmentMutation,
} from "@/api/shipments";
import { useCreateDraftMutation, useDraftQuery, useUpdateDraftMutation } from "@/api/drafts";
import {
  ConnectionInvalidError,
  OperatorUnavailableError,
} from "@/api/postal-connections";
import { useToast } from "@/components/Toast/use-toast";
import { SaveAsTemplateModal } from "@/components/SaveAsTemplateModal";
import { CancelGuardModal } from "@/components/CancelGuardModal";
import { useRecipientsQuery } from "@/api/recipients";
import type { Recipient } from "@/types/recipient";

const CARGO_CATEGORIES = [
  { value: "parcel", label: "Parcel" },
  { value: "documents", label: "Documents" },
  { value: "pallet", label: "Pallet" },
];

const PAYER_TYPES = [
  { value: "Sender", label: "Sender" },
  { value: "Recipient", label: "Recipient" },
  { value: "ThirdPerson", label: "Third person" },
];

const DELIVERY_TYPES = [
  { value: "", label: "Nova Post default" },
  { value: "standard", label: "Standard" },
  { value: "economy", label: "Economy" },
  { value: "express", label: "Express" },
];

const POSTAL_SERVICE_MODES = [
  {
    value: "nova-poshta",
    label: "Nova Post",
    description: "Branch-to-branch Nova Poshta shipment.",
  },
  {
    value: "ukrposhta",
    label: "Ukrposhta",
    description: "Mocked address shipment for now.",
  },
  {
    value: "meest",
    label: "Meest",
    description: "Mocked courier/address shipment for now.",
  },
] as const;

type PostalServiceMode = (typeof POSTAL_SERVICE_MODES)[number]["value"];

const POSTAL_SERVICE_MODE_OPTIONS = POSTAL_SERVICE_MODES.map(
  ({ value, label }) => ({ value, label }),
);

const MODE_FIELD_REQUIREMENTS: Record<
  PostalServiceMode,
  {
    division: boolean;
    postalCode: boolean;
    city: boolean;
    address: boolean;
    dimensions: boolean;
    insurance: boolean;
  }
> = {
  "nova-poshta": {
    division: true,
    postalCode: false,
    city: false,
    address: false,
    dimensions: true,
    insurance: true,
  },
  ukrposhta: {
    division: false,
    postalCode: true,
    city: true,
    address: true,
    dimensions: false,
    insurance: false,
  },
  meest: {
    division: false,
    postalCode: false,
    city: true,
    address: true,
    dimensions: true,
    insurance: false,
  },
};

const personSchema = z.object({
  name: z.string().min(1, "Required"),
  phone: z.string().min(1, "Required"),
  countryCode: z.string(),
  divisionNumber: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  postalCode: z.string().optional(),
});

const schema = z
  .object({
    postalServiceMode: z.enum(["nova-poshta", "ukrposhta", "meest"]),
    payerType: z.enum(["Sender", "Recipient", "ThirdPerson"]),
    payerContractNumber: z.string().optional(),
    clientOrder: z.string().max(50).optional(),
    note: z.string().max(255).optional(),
    deliveryType: z.enum(["standard", "economy", "express"]).optional(),
    readyToShip: z.boolean().optional(),
    sender: personSchema,
    recipient: personSchema,
    parcel: z.object({
      cargoCategory: z.string().min(1, "Required"),
      parcelDescription: z.string().min(1, "Required"),
      insuranceCost: z.number().min(0, "Must be >= 0"),
      actualWeight: z.number().min(0, "Must be >= 0"),
      dimensions: z.object({
        length: z.number().min(0, "Must be >= 0"),
        width: z.number().min(0, "Must be >= 0"),
        height: z.number().min(0, "Must be >= 0"),
      }),
    }),
    invoice: z.object({
      cost: z.number().min(0, "Must be >= 0"),
      currency: z.string(),
    }),
  })
  .superRefine((values, ctx) => {
    const requirements = MODE_FIELD_REQUIREMENTS[values.postalServiceMode];

    function requireText(path: (string | number)[], value: string | undefined) {
      if (!value?.trim()) {
        ctx.addIssue({ code: "custom", path, message: "Required" });
      }
    }

    function requirePositive(path: (string | number)[], value: number) {
      if (value <= 0) {
        ctx.addIssue({ code: "custom", path, message: "Must be > 0" });
      }
    }

    (["sender", "recipient"] as const).forEach((party) => {
      if (requirements.division) requireText([party, "divisionNumber"], values[party].divisionNumber);
      if (requirements.city) requireText([party, "city"], values[party].city);
      if (requirements.address) requireText([party, "address"], values[party].address);
      if (requirements.postalCode) requireText([party, "postalCode"], values[party].postalCode);
    });

    requirePositive(["parcel", "actualWeight"], values.parcel.actualWeight);

    if (requirements.dimensions) {
      requirePositive(["parcel", "dimensions", "length"], values.parcel.dimensions.length);
      requirePositive(["parcel", "dimensions", "width"], values.parcel.dimensions.width);
      requirePositive(["parcel", "dimensions", "height"], values.parcel.dimensions.height);
    }

    if (values.payerType === "ThirdPerson") {
      requireText(["payerContractNumber"], values.payerContractNumber);
    }
  });

type FormValues = z.infer<typeof schema>;

const DEFAULT_FORM_VALUES: FormValues = {
  postalServiceMode: "nova-poshta",
  payerType: "Sender",
  payerContractNumber: "",
  clientOrder: "",
  note: "",
  deliveryType: undefined,
  readyToShip: false,
  sender: {
    name: "",
    phone: "",
    countryCode: "UA",
    divisionNumber: "",
    city: "",
    address: "",
    postalCode: "",
  },
  recipient: {
    name: "",
    phone: "",
    countryCode: "UA",
    divisionNumber: "",
    city: "",
    address: "",
    postalCode: "",
  },
  parcel: {
    cargoCategory: "parcel",
    parcelDescription: "",
    insuranceCost: 0,
    actualWeight: 0,
    dimensions: { length: 0, width: 0, height: 0 },
  },
  invoice: { cost: 0, currency: "UAH" },
};

function normalizePostalServiceMode(value?: string | null): PostalServiceMode {
  switch (value) {
    case "nova-poshta":
    case "nova-post":
      return "nova-poshta";
    case "ukrposhta":
      return "ukrposhta";
    case "meest":
      return "meest";
    default:
      return "nova-poshta";
  }
}

function toPositiveNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function mapShipmentSourceToFormValues(
  data: Record<string, any>,
  fallbackMode?: string | null,
): FormValues {
  const parcel = data.parcel ?? data.parcels?.[0] ?? {};
  const dimensions = parcel.dimensions ?? {};
  const mode = normalizePostalServiceMode(
    data.postalServiceMode ??
      (typeof data.operator === "string" ? data.operator : data.operator?.slug) ??
      fallbackMode,
  );

  const actualWeight =
    data.parcel?.actualWeight != null
      ? toPositiveNumber(data.parcel.actualWeight)
      : toPositiveNumber(parcel.actualWeight) / 1000;
  const length =
    data.parcel?.dimensions?.length != null
      ? toPositiveNumber(data.parcel.dimensions.length)
      : toPositiveNumber(parcel.length ?? dimensions.length) / 10;
  const width =
    data.parcel?.dimensions?.width != null
      ? toPositiveNumber(data.parcel.dimensions.width)
      : toPositiveNumber(parcel.width ?? dimensions.width) / 10;
  const height =
    data.parcel?.dimensions?.height != null
      ? toPositiveNumber(data.parcel.dimensions.height)
      : toPositiveNumber(parcel.height ?? dimensions.height) / 10;

  return {
    postalServiceMode: mode,
    payerType: data.payerType ?? "Sender",
    payerContractNumber: data.payerContractNumber ?? "",
    clientOrder: data.clientOrder ?? "",
    note: data.note ?? "",
    deliveryType: data.deliveryType,
    readyToShip: data.readyToShip ?? data.status === "ReadyToShip",
    sender: {
      name: data.sender?.name ?? "",
      phone: data.sender?.phone ?? "",
      countryCode: data.sender?.countryCode ?? "UA",
      divisionNumber: data.sender?.divisionNumber ?? "",
      city: data.sender?.city ?? "",
      address: data.sender?.address ?? "",
      postalCode: data.sender?.postalCode ?? "",
    },
    recipient: {
      name: data.recipient?.name ?? data.recipientName ?? "",
      phone: data.recipient?.phone ?? data.recipientPhone ?? "",
      countryCode: data.recipient?.countryCode ?? "UA",
      divisionNumber: data.recipient?.divisionNumber ?? "",
      city: data.recipient?.city ?? "",
      address: data.recipient?.address ?? data.deliveryAddress ?? "",
      postalCode: data.recipient?.postalCode ?? "",
    },
    parcel: {
      cargoCategory: parcel.cargoCategory ?? "parcel",
      parcelDescription: parcel.parcelDescription ?? "",
      insuranceCost: toPositiveNumber(parcel.insuranceCost),
      actualWeight,
      dimensions: {
        length,
        width,
        height,
      },
    },
    invoice: {
      cost: toPositiveNumber(data.invoice?.cost),
      currency: data.invoice?.currency ?? "UAH",
    },
  };
}

function formatRecipientDisplayName(recipient: Recipient): string {
  if (recipient.type === "ORGANIZATION") {
    return (
      recipient.companyName?.trim() ||
      [recipient.lastName, recipient.firstName].filter(Boolean).join(" ").trim() ||
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

function FormLabel({ children, required }: { children: ReactNode; required?: boolean }) {
  return (
    <label className="mb-1.5 block text-sm font-medium text-neutral-700">
      {children}
      {!required ? <span className="ml-1 font-normal text-neutral-400">(optional)</span> : null}
    </label>
  );
}

function SelectField({
  label,
  options,
  error,
  required,
  ...props
}: {
  label: string;
  options: { value: string; label: string }[];
  error?: string;
  required?: boolean;
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div>
      <FormLabel required={required}>{label}</FormLabel>
      <select
        {...props}
        className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { mutateAsync, isPending } = useCreateNovaPoshtaShipmentMutation();
  const { mutateAsync: mutateUkrposhta } = useCreateUkrposhtaShipmentMutation();
  const { mutateAsync: mutateMeest } = useCreateMeestShipmentMutation();
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
  const duplicateTtn = searchParams.get("duplicate")?.trim() ?? "";
  const editTtn = searchParams.get("editTtn")?.trim() ?? "";
  const operatorParam = searchParams.get("operator");
  const draftIdParam = searchParams.get("draftId");
  const draftId = draftIdParam ? Number(draftIdParam) : NaN;
  const activeDraftId = Number.isInteger(draftId) && draftId > 0 ? draftId : 0;
  const sourceShipmentTtn = editTtn || duplicateTtn;
  const isShipmentEditMode = Boolean(editTtn);
  const isDuplicateMode = Boolean(duplicateTtn);
  const isDraftMode = Boolean(activeDraftId);
  const { data: shipmentPrefill, isLoading: isShipmentPrefillLoading } =
    useShipmentByTtnQuery(sourceShipmentTtn);
  const { data: draftPrefill, isLoading: isDraftPrefillLoading } =
    useDraftQuery(activeDraftId);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULT_FORM_VALUES,
  });

  const {
    register,
    handleSubmit,
    getValues,
    watch,
    formState: { errors, isDirty },
  } = form;

  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [manualGuardOpen, setManualGuardOpen] = useState(false);
  const [selectedRecipientId, setSelectedRecipientId] = useState("");
  const { mutateAsync: createDraft, isPending: isDraftPending } =
    useCreateDraftMutation();
  const { mutateAsync: updateDraft, isPending: isDraftUpdating } =
    useUpdateDraftMutation();
  const appliedPrefillKeyRef = useRef<string | null>(null);

  const selectedMode = watch("postalServiceMode");
  const payerType = watch("payerType");
  const selectedModeConfig =
    POSTAL_SERVICE_MODES.find((mode) => mode.value === selectedMode) ??
    POSTAL_SERVICE_MODES[0];
  const modeRequirements = MODE_FIELD_REQUIREMENTS[selectedModeConfig.value];
  const isSubmitting =
    isPending ||
    isDraftPending ||
    isDraftUpdating ||
    isUpdatingNovaPoshta ||
    isUpdatingUkrposhta ||
    isUpdatingMeest;
  const recipients = recipientsData?.items ?? [];
  const activePrefillKey = useMemo(() => {
    if (activeDraftId) return `draft:${activeDraftId}`;
    if (editTtn) return `edit:${editTtn}`;
    if (duplicateTtn) return `duplicate:${duplicateTtn}`;
    return null;
  }, [activeDraftId, duplicateTtn, editTtn]);
  const isPrefillLoading =
    (Boolean(sourceShipmentTtn) && isShipmentPrefillLoading) ||
    (Boolean(activeDraftId) && isDraftPrefillLoading);
  const pageTitle = isShipmentEditMode
    ? "Edit shipment"
    : isDuplicateMode
      ? "Duplicate shipment"
      : isDraftMode
        ? "Edit draft"
        : "New shipment";
  const pageDescription = isShipmentEditMode
    ? `Review and update the ${selectedModeConfig.label} shipment details.`
    : isDuplicateMode
      ? `Review the copied ${selectedModeConfig.label} shipment details before creating a new one.`
      : isDraftMode
        ? `Continue editing the ${selectedModeConfig.label} draft shipment.`
        : `Fill in the details to create a ${selectedModeConfig.label} shipment.`;
  const submitLabel = isShipmentEditMode
    ? "Update shipment"
    : isPending || isUpdatingNovaPoshta || isUpdatingUkrposhta || isUpdatingMeest
      ? "Saving..."
      : "Create shipment";

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
    if (!activePrefillKey || appliedPrefillKeyRef.current === activePrefillKey) return;

    if (activeDraftId && draftPrefill?.draftData) {
      form.reset(
        mapShipmentSourceToFormValues(
          draftPrefill.draftData as Record<string, any>,
          draftPrefill.draftData?.postalServiceMode as string | undefined,
        ),
      );
      setSelectedRecipientId("");
      appliedPrefillKeyRef.current = activePrefillKey;
      return;
    }

    if (sourceShipmentTtn && shipmentPrefill) {
      form.reset(mapShipmentSourceToFormValues(shipmentPrefill as Record<string, any>, operatorParam));
      setSelectedRecipientId("");
      appliedPrefillKeyRef.current = activePrefillKey;
    }
  }, [
    activeDraftId,
    activePrefillKey,
    draftPrefill,
    form,
    operatorParam,
    shipmentPrefill,
    sourceShipmentTtn,
  ]);

  function handleRecipientSelect(recipientId: string) {
    setSelectedRecipientId(recipientId);
    if (!recipientId) return;

    const recipient = recipients.find((item) => item.id === Number(recipientId));
    if (!recipient) return;

    form.setValue("recipient.name", formatRecipientDisplayName(recipient), {
      shouldDirty: true,
      shouldTouch: true,
    });
    form.setValue("recipient.phone", recipient.phone, {
      shouldDirty: true,
      shouldTouch: true,
    });

    if (recipient.address?.type === "BRANCH" && recipient.address.branchNumber) {
      form.setValue("recipient.divisionNumber", recipient.address.branchNumber, {
        shouldDirty: true,
        shouldTouch: true,
      });
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
        await createDraft({ draftData: getValues() as Record<string, unknown> });
      }
      toast({ title: "Draft saved", color: "success" });
      setManualGuardOpen(false);
      navigate(APP_ROUTES.shipments);
    } catch {
      toast({ title: "Failed to save draft", color: "error" });
    }
  }

  async function onSubmit(values: FormValues) {
    try {
      if (values.postalServiceMode === "ukrposhta" || values.postalServiceMode === "meest") {
        const body = {
          sender: { name: values.sender.name, phone: values.sender.phone },
          recipient: {
            name: values.recipient.name,
            phone: values.recipient.phone,
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
            values.postalServiceMode === "ukrposhta" ? updateUkrposhta : updateMeest;
          await updateFn({ ttn: editTtn, body });
        } else {
          const createFn =
            values.postalServiceMode === "ukrposhta" ? mutateUkrposhta : mutateMeest;
          await createFn(body);
        }
        toast({
          title: isShipmentEditMode ? "Shipment updated" : "Shipment created",
          color: "success",
        });
        navigate(APP_ROUTES.shipments);
        return;
      }

      const body = {
        payerType: values.payerType,
        payerContractNumber: values.payerContractNumber || undefined,
        clientOrder: values.clientOrder || undefined,
        note: values.note || undefined,
        deliveryType: values.deliveryType,
        status: values.readyToShip ? ("ReadyToShip" as const) : undefined,
        sender: {
          name: values.sender.name,
          phone: values.sender.phone,
          countryCode: values.sender.countryCode,
          divisionNumber: values.sender.divisionNumber || undefined,
        },
        recipient: {
          name: values.recipient.name,
          phone: values.recipient.phone,
          countryCode: values.recipient.countryCode,
          divisionNumber: values.recipient.divisionNumber || undefined,
        },
        parcels: [{
          rowNumber: 1,
          cargoCategory: values.parcel.cargoCategory as "parcel" | "documents" | "pallet",
          parcelDescription: values.parcel.parcelDescription,
          actualWeight: Math.round(values.parcel.actualWeight * 1000),
          length: Math.round(values.parcel.dimensions.length * 10),
          width: Math.round(values.parcel.dimensions.width * 10),
          height: Math.round(values.parcel.dimensions.height * 10),
          insuranceCost: values.parcel.insuranceCost,
        }],
        invoice: values.invoice.cost > 0 ? { cost: values.invoice.cost, currency: values.invoice.currency } : undefined,
        draftId: activeDraftId || undefined,
      };
      const result =
        isShipmentEditMode && editTtn
          ? await updateNovaPoshta({ ttn: editTtn, body })
          : await mutateAsync(body);
      toast({
        title: isShipmentEditMode ? "Shipment updated" : "Shipment created",
        description: result.scheduledDeliveryDate
          ? `Est. delivery: ${new Date(result.scheduledDeliveryDate).toLocaleDateString()}`
          : undefined,
        color: "success",
      });
      navigate(APP_ROUTES.shipments);
    } catch (err) {
      if (err instanceof ConnectionInvalidError) {
        toast({
          title: "Nova Post connection is invalid",
          description: "Reconnect your Nova Post account in Profile.",
          color: "error",
        });
      } else if (err instanceof OperatorUnavailableError) {
        toast({
          title: "Nova Post is temporarily unavailable",
          description: "Please try again later.",
          color: "error",
        });
      } else {
        toast({
          title: "Failed to create shipment",
          description: err instanceof Error ? err.message : "Please try again.",
          color: "error",
        });
      }
    }
  }

  if (isPrefillLoading) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="mb-1 text-2xl font-semibold text-neutral-900">{pageTitle}</h1>
        <p className="text-sm text-neutral-500">Loading shipment data...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="mb-1 text-2xl font-semibold text-neutral-900">{pageTitle}</h1>
      <p className="mb-8 text-sm text-neutral-500">{pageDescription}</p>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8">
        <section>
          <SectionHeader title="Postal service" />
          <SelectField
            label="Mode"
            options={POSTAL_SERVICE_MODE_OPTIONS}
            required
            error={errors.postalServiceMode?.message}
            disabled={isShipmentEditMode}
            {...register("postalServiceMode")}
          />
          <p className="mt-2 text-sm text-neutral-500">{selectedModeConfig.description}</p>
        </section>

        {selectedMode === "nova-poshta" ? (
          <section>
            <SectionHeader title="Shipping details" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <SelectField
                label="Payer"
                options={PAYER_TYPES}
                required
                error={errors.payerType?.message}
                {...register("payerType")}
              />
              {payerType === "ThirdPerson" ? (
                <div>
                  <FormLabel required>Contract number</FormLabel>
                  <Input {...register("payerContractNumber")} placeholder="Contract number" error={errors.payerContractNumber?.message} />
                </div>
              ) : null}
              <SelectField label="Delivery type" options={DELIVERY_TYPES} error={errors.deliveryType?.message} {...register("deliveryType")} />
              <div>
                <FormLabel>Client order</FormLabel>
                <Input {...register("clientOrder")} placeholder="Your internal order ID" error={errors.clientOrder?.message} />
              </div>
              <div className="sm:col-span-2">
                <FormLabel>Note</FormLabel>
                <Input {...register("note")} placeholder="Special delivery instructions" error={errors.note?.message} />
              </div>
            </div>
          </section>
        ) : null}
        <section>
          <SectionHeader title="Sender" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <FormLabel required>Full name</FormLabel>
              <Input {...register("sender.name")} placeholder="Ivan Petrenko" error={errors.sender?.name?.message} />
            </div>
            <div>
              <FormLabel required>Phone</FormLabel>
              <Input {...register("sender.phone")} placeholder="+380501234567" error={errors.sender?.phone?.message} />
            </div>
            {modeRequirements.division ? (
              <div>
                <FormLabel required>Division number</FormLabel>
                <Input {...register("sender.divisionNumber")} placeholder="1" error={errors.sender?.divisionNumber?.message} />
              </div>
            ) : null}
            {modeRequirements.city ? (
              <div>
                <FormLabel required>City</FormLabel>
                <Input {...register("sender.city")} placeholder="Kyiv" error={errors.sender?.city?.message} />
              </div>
            ) : null}
            {modeRequirements.address ? (
              <div>
                <FormLabel required>Address</FormLabel>
                <Input {...register("sender.address")} placeholder="Khreshchatyk St, 1" error={errors.sender?.address?.message} />
              </div>
            ) : null}
            {modeRequirements.postalCode ? (
              <div>
                <FormLabel required>Postal code</FormLabel>
                <Input {...register("sender.postalCode")} placeholder="01001" error={errors.sender?.postalCode?.message} />
              </div>
            ) : null}
          </div>
          <input type="hidden" {...register("sender.countryCode")} />
        </section>

        <section>
          <SectionHeader title="Recipient" />
          <div className="mb-4">
            <FormLabel>Select from saved recipients</FormLabel>
            <select
              value={selectedRecipientId}
              onChange={(event) => handleRecipientSelect(event.target.value)}
              className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            >
              <option value="">{recipientsLoading ? "Loading recipients..." : "Manual entry"}</option>
              {recipients.map((recipient) => (
                <option key={recipient.id} value={recipient.id}>
                  {formatRecipientDisplayName(recipient)}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <FormLabel required>Full name</FormLabel>
              <Input {...register("recipient.name")} placeholder="Olena Kovalenko" error={errors.recipient?.name?.message} />
            </div>
            <div>
              <FormLabel required>Phone</FormLabel>
              <Input {...register("recipient.phone")} placeholder="+380671234567" error={errors.recipient?.phone?.message} />
            </div>
            {modeRequirements.division ? (
              <div>
                <FormLabel required>Division number</FormLabel>
                <Input {...register("recipient.divisionNumber")} placeholder="42" error={errors.recipient?.divisionNumber?.message} />
              </div>
            ) : null}
            {modeRequirements.city ? (
              <div>
                <FormLabel required>City</FormLabel>
                <Input {...register("recipient.city")} placeholder="Lviv" error={errors.recipient?.city?.message} />
              </div>
            ) : null}
            {modeRequirements.address ? (
              <div>
                <FormLabel required>Address</FormLabel>
                <Input {...register("recipient.address")} placeholder="Shevchenka St, 10" error={errors.recipient?.address?.message} />
              </div>
            ) : null}
            {modeRequirements.postalCode ? (
              <div>
                <FormLabel required>Postal code</FormLabel>
                <Input {...register("recipient.postalCode")} placeholder="79000" error={errors.recipient?.postalCode?.message} />
              </div>
            ) : null}
          </div>
          <input type="hidden" {...register("recipient.countryCode")} />
        </section>

        <section>
          <SectionHeader title="Parcel" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SelectField label="Cargo category" options={CARGO_CATEGORIES} required error={errors.parcel?.cargoCategory?.message} {...register("parcel.cargoCategory")} />
            <div>
              <FormLabel required>Description</FormLabel>
              <Input {...register("parcel.parcelDescription")} placeholder="Books, clothing..." error={errors.parcel?.parcelDescription?.message} />
            </div>
            <div>
              <FormLabel required>Weight (kg)</FormLabel>
              <Input {...register("parcel.actualWeight", { valueAsNumber: true })} type="number" step="0.001" min="0" placeholder="0.5" error={errors.parcel?.actualWeight?.message} />
            </div>
            {modeRequirements.insurance ? (
              <div>
                <FormLabel required>Declared value (UAH)</FormLabel>
                <Input {...register("parcel.insuranceCost", { valueAsNumber: true })} type="number" step="1" min="0" placeholder="500" error={errors.parcel?.insuranceCost?.message} />
              </div>
            ) : null}
          </div>
          {modeRequirements.dimensions ? (
            <div className="mt-4">
              <FormLabel required>Dimensions (cm)</FormLabel>
              <div className="grid grid-cols-3 gap-3">
                <Input {...register("parcel.dimensions.length", { valueAsNumber: true })} type="number" step="0.1" min="0" placeholder="Length" error={errors.parcel?.dimensions?.length?.message} />
                <Input {...register("parcel.dimensions.width", { valueAsNumber: true })} type="number" step="0.1" min="0" placeholder="Width" error={errors.parcel?.dimensions?.width?.message} />
                <Input {...register("parcel.dimensions.height", { valueAsNumber: true })} type="number" step="0.1" min="0" placeholder="Height" error={errors.parcel?.dimensions?.height?.message} />
              </div>
            </div>
          ) : null}
        </section>

        <section>
          <SectionHeader title="Invoice" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <FormLabel>Declared cost (UAH)</FormLabel>
              <Input {...register("invoice.cost", { valueAsNumber: true })} type="number" step="1" min="0" placeholder="0" error={errors.invoice?.cost?.message} />
            </div>
          </div>
          <input type="hidden" {...register("invoice.currency")} />
        </section>

        <div className="flex gap-3">
          <Button type="button" variant="outline" color="green" className="flex-1" disabled={isSubmitting} onClick={() => setIsTemplateModalOpen(true)}>
            Save as template
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
            Cancel
          </Button>
          <Button type="submit" color="green" className="flex-1" disabled={isSubmitting}>
            {submitLabel}
          </Button>
        </div>
      </form>

      <SaveAsTemplateModal
        open={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        cargoCategory={getValues("parcel.cargoCategory")}
        templateData={getValues() as Record<string, unknown>}
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
