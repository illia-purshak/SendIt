import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useParams } from "react-router-dom";
import { APP_ROUTES } from "@/constants/app-routes";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Spinner } from "@/components/Loader/Spinner";
import { useCreateTemplateMutation, useTemplateQuery, useUpdateTemplateMutation } from "@/api/templates";
import { usePostalConnectionsQuery } from "@/api/postal-connections";
import { toastStore } from "@/store/toastStore";
import type { ShipmentType } from "@/types/template";

const SHIPMENT_TYPES: { value: ShipmentType; label: string }[] = [
  { value: "DOCUMENT", label: "Document" },
  { value: "PACKAGE", label: "Package" },
  { value: "BOX", label: "Box" },
  { value: "CARGO", label: "Cargo" },
  { value: "PALLET", label: "Pallet" },
  { value: "UNKNOWN", label: "Other" },
];

const templateSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Max 100 characters"),
  description: z.string().max(500, "Max 500 characters").optional(),
  postalServiceId: z.number().min(1, "Select a postal service"),
  shipmentType: z.enum(["DOCUMENT", "PACKAGE", "BOX", "CARGO", "PALLET", "UNKNOWN"]),
});

type TemplateFormValues = z.infer<typeof templateSchema>;

export default function TemplateFormPage() {
  const { id: idParam } = useParams();
  const isEdit = Boolean(idParam);
  const templateId = idParam ? Number(idParam) : 0;

  const { data: template, isLoading } = useTemplateQuery(templateId);

  if (isEdit && isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <Spinner />
      </div>
    );
  }

  return <TemplateForm templateId={templateId} defaultValues={template ? {
    name: template.name,
    description: template.description ?? "",
    postalServiceId: template.postalService.id,
    shipmentType: template.shipmentType,
  } : undefined} />;
}

function TemplateForm({
  templateId,
  defaultValues,
}: {
  templateId: number;
  defaultValues?: Partial<TemplateFormValues>;
}) {
  const navigate = useNavigate();
  const isEdit = Boolean(defaultValues);

  const { data: connectionsData, isLoading: loadingConnections } = usePostalConnectionsQuery();
  const { mutateAsync: createTemplate, isPending: isCreating } = useCreateTemplateMutation();
  const { mutateAsync: updateTemplate, isPending: isUpdating } = useUpdateTemplateMutation();

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: "",
      description: "",
      postalServiceId: 0,
      shipmentType: "PACKAGE",
      ...defaultValues,
    },
  });

  const isPending = isCreating || isUpdating;

  async function onSubmit(values: TemplateFormValues) {
    try {
      const body = {
        name: values.name,
        description: values.description || null,
        postalServiceId: values.postalServiceId,
        shipmentType: values.shipmentType,
        templateData: {},
      };
      if (isEdit) {
        await updateTemplate({ id: templateId, body });
        toastStore.toast({ title: "Template updated", color: "success" });
      } else {
        await createTemplate(body);
        toastStore.toast({ title: "Template created", color: "success" });
      }
      navigate(APP_ROUTES.templates);
    } catch (err) {
      toastStore.toast({
        title: "Failed to save",
        description: err instanceof Error ? err.message : "Please try again.",
        color: "error",
      });
    }
  }

  const connections = connectionsData?.connections ?? [];

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="mb-1 text-2xl font-semibold text-neutral-900">
        {isEdit ? "Edit template" : "New template"}
      </h1>
      <p className="mb-8 text-sm text-neutral-500">
        {isEdit
          ? "Update the template details below."
          : "Fill in the details to create a reusable shipment template."}
      </p>

      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">
            Template name
          </label>
          <Input
            {...form.register("name")}
            placeholder="e.g. Standard parcel"
            error={form.formState.errors.name?.message}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">
            Description <span className="font-normal text-neutral-400">(optional)</span>
          </label>
          <textarea
            {...form.register("description")}
            rows={3}
            placeholder="Briefly describe this template"
            className="w-full resize-none rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          />
          {form.formState.errors.description && (
            <p className="mt-1 text-xs text-red-600">{form.formState.errors.description.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">
            Postal service
          </label>
          {loadingConnections ? (
            <div className="h-10 w-full animate-pulse rounded-lg bg-neutral-100" />
          ) : connections.length === 0 ? (
            <p className="text-sm text-neutral-500">
              No connected postal services. Connect one in your profile first.
            </p>
          ) : (
            <select
              {...form.register("postalServiceId", { valueAsNumber: true })}
              className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            >
              <option value={0} disabled>Select a service…</option>
              {connections.map((c) => (
                <option key={c.postalService.id} value={c.postalService.id}>
                  {c.postalService.name}
                </option>
              ))}
            </select>
          )}
          {form.formState.errors.postalServiceId && (
            <p className="mt-1 text-xs text-red-600">
              {form.formState.errors.postalServiceId.message}
            </p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">
            Shipment type
          </label>
          <select
            {...form.register("shipmentType")}
            className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          >
            {SHIPMENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-2 flex gap-3">
          <Button
            type="button"
            variant="outline"
            color="neutral"
            className="flex-1"
            disabled={isPending}
            onClick={() => navigate(APP_ROUTES.templates)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            color="green"
            className="flex-1"
            disabled={isPending}
          >
            {isPending ? "Saving…" : isEdit ? "Save changes" : "Create template"}
          </Button>
        </div>
      </form>
    </main>
  );
}
