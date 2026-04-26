import { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams } from "react-router-dom";
import { VerticalStepper } from "@/components/Stepper/VerticalStepper";
import { APP_ROUTES } from "@/constants/app-routes";
import { Button } from "@/components/Button";
import { Spinner } from "@/components/Loader/Spinner";
import {
  useCreateParcelTemplateMutation,
  useParcelTemplateQuery,
  useUpdateParcelTemplateMutation,
} from "@/api/parcel-templates";
import type { ParcelTemplate } from "@/types/parcel-templates";
import { GeneralForm } from "./GeneralForm";
import { ParcelsForm } from "./ParcelsForm";
import {
  draftToItem,
  emptyDraft,
  getItemErrors,
  itemToDraft,
  validateItems,
} from "./parcel-items";
import { RecipientForm } from "./RecipientForm";
import { SenderForm } from "./SenderForm";
import type { ItemDraft } from "./types";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { parcelTemplateSchema } from "@/validation/parcel-template";
import type { ParcelTemplateFormValues } from "@/validation/parcel-template";
import { toastStore } from "@/store/toastStore";

export default function ParcelTemplateFormPage() {
  const { id: idParam } = useParams();
  const isEdit = Boolean(idParam);
  const templateId = idParam ? Number(idParam) : 0;

  const { data: template, isLoading } = useParcelTemplateQuery(templateId);

  if (isEdit && isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <Spinner />
      </div>
    );
  }

  return <TemplateForm template={template} />;
}

function TemplateForm({ template }: { template?: ParcelTemplate }) {
  const navigate = useNavigate();
  const isEdit = Boolean(template);
  const { errorHandler } = useErrorHandler();

  const { mutate: createParcelTemplate } = useCreateParcelTemplateMutation();
  const { mutate: editParcelTemplate } = useUpdateParcelTemplateMutation();

  const [items, setItems] = useState<ItemDraft[]>(
    template ? template.parcelItems.map(itemToDraft) : [emptyDraft()],
  );
  const [itemErrors, setItemErrors] = useState(getItemErrors(items));

  const form = useForm<ParcelTemplateFormValues>({
    resolver: zodResolver(parcelTemplateSchema),
    defaultValues: {
      name: template?.name ?? "",
      description: template?.description ?? "",
      senderName: template?.senderName ?? "",
      senderPhone: template?.senderPhone ?? "",
      senderAddress: template?.senderAddress ?? "",
      senderCity: template?.senderCity ?? "",
      recipientName: template?.recipientName ?? "",
      recipientPhone: template?.recipientPhone ?? "",
      recipientAddress: template?.recipientAddress ?? "",
      recipientCity: template?.recipientCity ?? "",
      payerType: template?.payerType ?? "SENDER",
      isDefault: template?.isDefault ?? false,
    },
  });

  async function onSubmit(values: ParcelTemplateFormValues) {
    const itemError = validateItems(items);
    if (itemError) {
      toastStore.toast({ title: itemError, color: "error" });
      return;
    }

    const body = {
      ...values,
      description: values.description || undefined,
      parcelItems: items.map(draftToItem),
    };

    if (isEdit) {
      editParcelTemplate(
        { id: template!.id, body },
        {
          onSuccess: () => navigate(APP_ROUTES.parcelTemplates),
          onError: errorHandler,
        },
      );
    } else {
      createParcelTemplate(body, {
        onSuccess: () => navigate(APP_ROUTES.parcelTemplates),
        onError: errorHandler,
      });
    }
  }

  function addItem() {
    setItems((prev) => {
      const next = [...prev, emptyDraft()];
      setItemErrors(getItemErrors(next));
      return next;
    });
  }

  function removeItem(index: number) {
    setItems((prev) => {
      const next = prev.filter((_, i) => i !== index);
      setItemErrors(getItemErrors(next));
      return next;
    });
  }

  function updateItem(index: number, patch: Partial<ItemDraft>) {
    setItems((prev) => {
      const next = prev.map((item, i) =>
        i === index ? { ...item, ...patch } : item,
      );
      setItemErrors(getItemErrors(next));
      return next;
    });
  }

  const { formState: { isSubmitting } } = form;

  return (
    <main className="px-6 py-10">
      <h1 className="mb-1 text-2xl font-semibold text-neutral-900">
        {isEdit ? "Edit template" : "New parcel template"}
      </h1>
      <p className="mb-8 text-sm text-neutral-500">
        {isEdit
          ? "Update the template details below."
          : "Fill in the details to create a reusable parcel template."}
      </p>

      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
          <VerticalStepper>
            <GeneralForm />
            <SenderForm />
            <RecipientForm />
            <ParcelsForm
              items={items}
              itemErrors={itemErrors}
              onAddItem={addItem}
              onRemoveItem={removeItem}
              onUpdateItem={updateItem}
            />
          </VerticalStepper>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              color="neutral"
              className="flex-1"
              disabled={isSubmitting}
              onClick={() => navigate(APP_ROUTES.parcelTemplates)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              color="green"
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving…" : isEdit ? "Save changes" : "Create template"}
            </Button>
          </div>
        </form>
      </FormProvider>
    </main>
  );
}
