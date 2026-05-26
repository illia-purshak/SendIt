import { useEffect, useState } from "react";
import { Package, Pencil, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import { Button } from "@/components/Button";
import { IconButton } from "@/components/IconButton";
import { Spinner } from "@/components/Loader/Spinner";
import {
  useAdminServicesQuery,
  useAdminCreateServiceMutation,
  useAdminUpdateServiceMutation,
  useAdminDeleteServiceMutation,
  ServiceHasConnectionsError,
} from "@/api/admin-services";
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
import { toastStore } from "@/store/toastStore";
import type { AdminService } from "@/types/admin-service";

interface ServiceEditorDialogProps {
  mode: "create" | "edit";
  service?: AdminService | null;
  open: boolean;
  onClose: () => void;
}

function ServiceEditorDialog({
  mode,
  service,
  open,
  onClose,
}: ServiceEditorDialogProps) {
  const createMutation = useAdminCreateServiceMutation();
  const updateMutation = useAdminUpdateServiceMutation();
  const [name, setName] = useState(service?.name ?? "");
  const [slug, setSlug] = useState(service?.slug ?? "");
  const [logoUrl, setLogoUrl] = useState(service?.logoUrl ?? "");

  useEffect(() => {
    setName(service?.name ?? "");
    setSlug(service?.slug ?? "");
    setLogoUrl(service?.logoUrl ?? "");
  }, [service, open]);

  async function handleSubmit() {
    if (!name.trim()) {
      toastStore.toast({
        title: "Name is required",
        color: "warning",
      });
      return;
    }

    if (mode === "create" && !slug.trim()) {
      toastStore.toast({
        title: "Slug is required",
        color: "warning",
      });
      return;
    }

    try {
      if (mode === "create") {
        await createMutation.mutateAsync({
          name: name.trim(),
          slug: slug.trim(),
          logoUrl: logoUrl.trim() || null,
        });
        toastStore.toast({ title: "Service created", color: "success" });
      } else if (service) {
        await updateMutation.mutateAsync({
          id: service.id,
          body: {
            name: name.trim(),
            logoUrl: logoUrl.trim() || null,
          },
        });
        toastStore.toast({ title: "Service updated", color: "success" });
      }

      onClose();
    } catch (err) {
      toastStore.toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to save service",
        color: "error",
      });
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <AlertDialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <AlertDialogContent>
        <AlertDialogTitle>
          {mode === "create" ? "Add service" : `Edit ${service?.name ?? "service"}`}
        </AlertDialogTitle>
        <AlertDialogDescription>
          {mode === "create"
            ? "Create a postal operator entry for the admin catalog."
            : "Update the service details shown to admins and clients."}
        </AlertDialogDescription>
        <div className="mt-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-neutral-500">Name</span>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
              placeholder="Nova Poshta"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-neutral-500">Slug</span>
            <input
              type="text"
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              disabled={mode === "edit"}
              className="rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 disabled:bg-neutral-50 disabled:text-neutral-400"
              placeholder="nova-poshta"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-neutral-500">Logo URL</span>
            <input
              type="url"
              value={logoUrl}
              onChange={(event) => setLogoUrl(event.target.value)}
              className="rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
              placeholder="https://..."
            />
          </label>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Saving..." : mode === "create" ? "Create service" : "Save changes"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function AdminServicesPage() {
  const { data, isLoading, error } = useAdminServicesQuery();
  const updateMutation = useAdminUpdateServiceMutation();
  const deleteMutation = useAdminDeleteServiceMutation();
  const [editorMode, setEditorMode] = useState<"create" | "edit" | null>(null);
  const [selectedService, setSelectedService] = useState<AdminService | null>(null);
  const [pendingToggleId, setPendingToggleId] = useState<number | null>(null);

  const services = data?.items ?? [];

  async function handleToggle(id: number, isActive: boolean) {
    setPendingToggleId(id);
    try {
      await updateMutation.mutateAsync({ id, body: { isActive: !isActive } });
      toastStore.toast({
        title: `Service ${isActive ? "deactivated" : "activated"}`,
        color: "success",
      });
    } catch (err) {
      toastStore.toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update service",
        color: "error",
      });
    } finally {
      setPendingToggleId(null);
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteMutation.mutateAsync(id);
      toastStore.toast({ title: "Service deleted", color: "success" });
    } catch (err) {
      const message =
        err instanceof ServiceHasConnectionsError
          ? "Cannot delete - service has active user connections."
          : err instanceof Error
            ? err.message
            : "Failed to delete service";
      toastStore.toast({ title: "Error", description: message, color: "error" });
    }
  }

  function openCreateDialog() {
    setSelectedService(null);
    setEditorMode("create");
  }

  function openEditDialog(service: AdminService) {
    setSelectedService(service);
    setEditorMode("edit");
  }

  function closeEditorDialog() {
    setSelectedService(null);
    setEditorMode(null);
  }

  return (
    <main className="py-10">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Postal services</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Manage which operators are available to clients.
          </p>
        </div>
        <Button color="green" onClick={openCreateDialog}>
          Add service
        </Button>
      </div>

      {(editorMode === "create" || editorMode === "edit") && (
        <ServiceEditorDialog
          mode={editorMode}
          service={selectedService}
          open
          onClose={closeEditorDialog}
        />
      )}

      {isLoading && (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      )}

      {!isLoading && error && (
        <p className="py-10 text-center text-sm text-red-500">Failed to load services.</p>
      )}

      {!isLoading && !error && (
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50">
                <Th>Service</Th>
                <Th>Slug</Th>
                <Th>Status</Th>
                <Th>Created</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {services.map((service) => {
                const isDeleting =
                  deleteMutation.isPending && deleteMutation.variables === service.id;
                const isToggling = pendingToggleId === service.id;

                return (
                  <tr
                    key={service.id}
                    className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {service.logoUrl ? (
                          <img
                            src={service.logoUrl}
                            alt={service.name}
                            className="h-10 w-10 rounded-xl border border-neutral-200 object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-500">
                            <Package size={18} />
                          </div>
                        )}
                        <span className="font-medium text-neutral-900">{service.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-neutral-500">
                      {service.slug}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          service.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-neutral-100 text-neutral-500"
                        }`}
                      >
                        {service.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-500">
                      {new Date(service.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex w-fit items-center justify-end gap-1">
                        <IconButton
                          aria-label="Edit service"
                          variant="ghost"
                          color="neutral"
                          size="sm"
                          title="Edit service"
                          onClick={() => openEditDialog(service)}
                        >
                          <Pencil size={14} />
                        </IconButton>
                        <IconButton
                          aria-label={service.isActive ? "Deactivate service" : "Activate service"}
                          variant="ghost"
                          color="neutral"
                          size="sm"
                          title={service.isActive ? "Deactivate service" : "Activate service"}
                          disabled={isToggling}
                          onClick={() => handleToggle(service.id, service.isActive)}
                        >
                          {service.isActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                        </IconButton>
                        <AlertDialog color="error">
                          <AlertDialogTrigger asChild>
                            <IconButton
                              aria-label="Delete service"
                              variant="ghost"
                              color="error"
                              size="sm"
                              title={isDeleting ? "Deleting service" : "Delete service"}
                              disabled={isDeleting}
                            >
                              <Trash2 size={14} />
                            </IconButton>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogTitle>Delete service?</AlertDialogTitle>
                            <AlertDialogDescription>
                              &quot;{service.name}&quot; will be permanently removed. This will
                              fail if users are still connected.
                            </AlertDialogDescription>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(service.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {services.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm text-neutral-400">
                    No services configured.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">
      {children}
    </th>
  );
}
