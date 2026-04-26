import { useNavigate } from "react-router-dom";
import { APP_ROUTES } from "@/constants/app-routes";
import { Button } from "@/components/Button";
import { Spinner } from "@/components/Loader/Spinner";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/AlertDialog";
import {
  useParcelTemplatesQuery,
  useSetDefaultParcelTemplateMutation,
  useDeleteParcelTemplateMutation,
} from "@/api/parcel-templates";
import { toastStore } from "@/store/toastStore";
import type { ParcelTemplate } from "@/types/parcel-templates";

const payerTypeLabel: Record<string, string> = {
  SENDER: "Sender pays",
  RECEIVER: "Receiver pays",
  THIRD_PARTY: "Third party pays",
};

export default function ParcelTemplatesPage() {
  const navigate = useNavigate();
  const { data: templates, isLoading, error } = useParcelTemplatesQuery();
  const setDefaultMutation = useSetDefaultParcelTemplateMutation();
  const deleteMutation = useDeleteParcelTemplateMutation();

  async function handleSetDefault(id: number) {
    try {
      await setDefaultMutation.mutateAsync(id);
      toastStore.toast({ title: "Default template updated", color: "success" });
    } catch (err) {
      toastStore.toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to update default",
        color: "error",
      });
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteMutation.mutateAsync(id);
      toastStore.toast({ title: "Template deleted", color: "success" });
    } catch (err) {
      toastStore.toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to delete template",
        color: "error",
      });
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">
            Parcel Templates
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Save sender, recipient, and item details for faster shipment
            creation.
          </p>
        </div>
        <Button
          color="green"
          onClick={() => navigate(APP_ROUTES.newParcelTemplate)}
        >
          New template
        </Button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      )}

      {!isLoading && error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-10 text-center">
          <p className="text-sm font-medium text-red-700">
            Failed to load templates.
          </p>
          <p className="mt-1 text-sm text-red-600">
            {error instanceof Error ? error.message : "Please try again."}
          </p>
        </div>
      )}

      {!isLoading && !error && templates?.length === 0 && (
        <div className="rounded-xl border border-neutral-200 bg-white px-6 py-20 text-center shadow-sm">
          <p className="text-base font-medium text-neutral-900">
            No templates yet
          </p>
          <p className="mt-1 text-sm text-neutral-500">
            Create your first template to speed up shipment creation.
          </p>
          <Button
            color="green"
            className="mt-6 text-sm"
            onClick={() => navigate(APP_ROUTES.newParcelTemplate)}
          >
            Create template
          </Button>
        </div>
      )}

      {!isLoading && !error && templates && templates.length > 0 && (
        <div className="flex flex-col gap-4">
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onEdit={() =>
                navigate(
                  APP_ROUTES.editParcelTemplate.replace(
                    ":id",
                    String(template.id),
                  ),
                )
              }
              onSetDefault={() => handleSetDefault(template.id)}
              onDelete={() => handleDelete(template.id)}
              isSettingDefault={
                setDefaultMutation.isPending &&
                setDefaultMutation.variables === template.id
              }
              isDeleting={
                deleteMutation.isPending &&
                deleteMutation.variables === template.id
              }
            />
          ))}
        </div>
      )}
    </main>
  );
}

interface TemplateCardProps {
  template: ParcelTemplate;
  onEdit: () => void;
  onSetDefault: () => void;
  onDelete: () => void;
  isSettingDefault: boolean;
  isDeleting: boolean;
}

function TemplateCard({
  template,
  onEdit,
  onSetDefault,
  onDelete,
  isSettingDefault,
  isDeleting,
}: TemplateCardProps) {
  return (
    <div
      className={[
        "rounded-2xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md",
        template.isDefault
          ? "border-green-300 ring-1 ring-green-200"
          : "border-neutral-200",
      ].join(" ")}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h2 className="truncate text-base font-semibold text-neutral-900">
              {template.name}
            </h2>
            {template.isDefault && (
              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
                Default
              </span>
            )}
            <span className="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-600">
              {payerTypeLabel[template.payerType] ?? template.payerType}
            </span>
          </div>

          {template.description && (
            <p className="mb-4 line-clamp-2 text-sm text-neutral-500">
              {template.description}
            </p>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <InfoBlock
              label="Sender"
              value={`${template.senderName} · ${template.senderCity}`}
            />
            <InfoBlock
              label="Recipient"
              value={`${template.recipientName} · ${template.recipientCity}`}
            />
            <InfoBlock
              label="Parcel items"
              value={`${template.parcelItems.length} item${template.parcelItems.length !== 1 ? "s" : ""}`}
            />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {!template.isDefault && (
            <Button
              variant="outline"
              color="green"
              size="sm"
              onClick={onSetDefault}
              disabled={isSettingDefault}
            >
              {isSettingDefault ? "Updating…" : "Set default"}
            </Button>
          )}
          <Button variant="outline" color="neutral" size="sm" onClick={onEdit}>
            Edit
          </Button>
          <AlertDialog color="error">
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                color="error"
                size="sm"
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting…" : "Delete"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogTitle>Delete template?</AlertDialogTitle>
              <AlertDialogDescription>
                "{template.name}" will be permanently removed. This cannot be
                undone.
              </AlertDialogDescription>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
        {label}
      </p>
      <p className="mt-0.5 truncate text-sm text-neutral-700">{value}</p>
    </div>
  );
}
