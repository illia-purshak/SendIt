import { useNavigate } from "react-router-dom";
import { Copy, Eye, Pencil, Trash2 } from "lucide-react";
import { APP_ROUTES } from "@/constants/app-routes";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/AlertDialog";
import { Button } from "@/components/Button";
import { DatePicker } from "@/components/DatePicker";
import { IconButton } from "@/components/IconButton";
import { Input } from "@/components/Input";
import { useToast } from "@/components/Toast/use-toast";
import { useDeleteDraftMutation } from "@/api/drafts";
import { ConnectionInvalidError } from "@/api/postal-connections";
import {
  useDeleteNovaPoshtaShipmentMutation,
  useDeleteUkrposhtaShipmentMutation,
  useDeleteMeestShipmentMutation,
  useShipmentsQuery,
} from "@/api/shipments";
import type {
  ShipmentListItem,
  ShipmentQueryParams,
  ShipmentStatus,
} from "@/types/shipment";
import { DataTable, useDataTableUrlState } from "@/components/DataTable";
import type { ColumnDef } from "@/components/DataTable";

const STATUS_LABEL: Record<ShipmentStatus, string> = {
  DRAFT: "Draft",
  CREATED: "Created",
  PREPARING: "Preparing",
  IN_TRANSIT: "In transit",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  RETURNED: "Returned",
  UNKNOWN: "Unknown",
};

const STATUS_CLASS: Record<ShipmentStatus, string> = {
  DRAFT: "bg-neutral-100 text-neutral-500",
  CREATED: "bg-blue-50 text-blue-700",
  PREPARING: "bg-yellow-100 text-yellow-800",
  IN_TRANSIT: "bg-blue-100 text-blue-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-neutral-100 text-neutral-500",
  RETURNED: "bg-orange-100 text-orange-700",
  UNKNOWN: "bg-neutral-100 text-neutral-400",
};

const PAGE_SIZE = 20;

const ACTIONABLE_STATUSES = new Set<ShipmentStatus>(['DRAFT', 'CREATED', 'PREPARING']);

const STATUS_FILTER_OPTIONS = Object.entries(STATUS_LABEL).map(
  ([value, label]) => ({ value, label }),
);
const OPERATOR_FILTER_OPTIONS = [
  { value: "novapost", label: "Nova Poshta" },
  { value: "ukrposhta", label: "Ukrposhta" },
  { value: "meest", label: "Meest" },
];

function formatDateParam(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateParam(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day);
}

const COLUMNS: ColumnDef<ShipmentListItem>[] = [
  {
    id: "ttn",
    header: "TTN / ID",
    cell: (s) => (
      <span className="font-mono text-xs text-neutral-700">
        {s.ttn ?? (s.draftId != null ? `Draft #${s.draftId}` : "—")}
      </span>
    ),
    filterable: true,
    filterType: "text",
    width: 160,
  },
  {
    id: "operator",
    header: "Operator",
    cell: (s) => s.operatorName,
    filterable: true,
    filterType: "select",
    filterOptions: OPERATOR_FILTER_OPTIONS,
    width: 140,
  },
  {
    id: "recipient",
    header: "Recipient",
    cell: (s) => s.recipientName ?? "—",
    sortable: true,
    filterable: true,
    filterType: "text",
  },
  {
    id: "status",
    header: "Status",
    cell: (s) => (
      <span
        className={[
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
          STATUS_CLASS[s.normalizedStatus],
        ].join(" ")}
      >
        {STATUS_LABEL[s.normalizedStatus]}
      </span>
    ),
    filterable: true,
    filterType: "select",
    filterOptions: STATUS_FILTER_OPTIONS,
    width: 140,
  },
  {
    id: "createdAt",
    header: "Date",
    cell: (s) => new Date(s.createdAt).toLocaleDateString(),
    sortable: true,
    width: 110,
  },
  {
    id: "declaredValue",
    header: "Value, ₴",
    cell: (s) => (s.declaredValue != null ? s.declaredValue : "—"),
    sortable: true,
    width: 100,
  },
  {
    id: "actions",
    header: "Actions",
    cell: () => null,
    hideable: false,
    width: 1,
  },
];

export default function ShipmentsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    urlState,
    setSortState,
    setFilterState,
    setPage,
    setColumnVisibility,
    resetTableState,
  } = useDataTableUrlState();
  const { page, sortState, filterState, columnVisibility } = urlState;
  const deleteDraftMutation = useDeleteDraftMutation();
  const deleteShipmentMutation = useDeleteNovaPoshtaShipmentMutation();
  const deleteUkrposhtaMutation = useDeleteUkrposhtaShipmentMutation();
  const deleteMeestMutation = useDeleteMeestShipmentMutation();

  const createdFrom = parseDateParam(filterState["createdFrom"]);
  const createdTo = parseDateParam(filterState["createdTo"]);

  async function handleDeleteNovaPoshtaShipment(ttn: string) {
    try {
      await deleteShipmentMutation.mutateAsync(ttn);
      toast({ title: "Shipment deleted", color: "success" });
    } catch (err) {
      if (err instanceof ConnectionInvalidError) {
        toast({
          title: "Nova Poshta connection invalid",
          description: "Please reconnect your Nova Poshta account in Profile settings.",
          color: "error",
        });
      } else {
        toast({
          title: "Failed to delete shipment",
          description: err instanceof Error ? err.message : "Please try again.",
          color: "error",
        });
      }
    }
  }

  async function handleDeleteUkrposhtaShipment(ttn: string) {
    try {
      await deleteUkrposhtaMutation.mutateAsync(ttn);
      toast({ title: "Shipment deleted", color: "success" });
    } catch (err) {
      toast({
        title: "Failed to delete shipment",
        description: err instanceof Error ? err.message : "Please try again.",
        color: "error",
      });
    }
  }

  async function handleDeleteMeestShipment(ttn: string) {
    try {
      await deleteMeestMutation.mutateAsync(ttn);
      toast({ title: "Shipment deleted", color: "success" });
    } catch (err) {
      toast({
        title: "Failed to delete shipment",
        description: err instanceof Error ? err.message : "Please try again.",
        color: "error",
      });
    }
  }

  async function handleDeleteDraft(draftId: number) {
    try {
      await deleteDraftMutation.mutateAsync(draftId);
      toast({ title: "Draft deleted", color: "success" });
    } catch (err) {
      toast({
        title: "Failed to delete draft",
        description: err instanceof Error ? err.message : "Please try again.",
        color: "error",
      });
    }
  }

  const columns: ColumnDef<ShipmentListItem>[] = COLUMNS.map((column) =>
    column.id === "actions"
      ? {
          ...column,
          cell: (shipment) => {
            const fallbackActionable = ACTIONABLE_STATUSES.has(
              shipment.normalizedStatus,
            );
            const canDuplicate =
              shipment.kind === "shipment" &&
              Boolean(shipment.ttn) &&
              (shipment.canDuplicate ?? fallbackActionable);
            const canEdit =
              shipment.kind === "draft"
                ? shipment.draftId != null &&
                  (shipment.canEdit ?? fallbackActionable)
                : shipment.kind === "shipment" &&
                  Boolean(shipment.ttn) &&
                  (shipment.canEdit ?? fallbackActionable);
            const canView =
              shipment.kind === "shipment" && Boolean(shipment.ref);
            const canDeleteDraft =
              shipment.kind === "draft" && shipment.draftId != null;
            const canDeleteNovaPost =
              shipment.kind === "shipment" &&
              shipment.operator === "nova-post" &&
              Boolean(shipment.ttn) &&
              fallbackActionable;
            const canDeleteUkrposhta =
              shipment.kind === "shipment" &&
              shipment.operator === "ukrposhta" &&
              Boolean(shipment.ttn) &&
              fallbackActionable;
            const canDeleteMeest =
              shipment.kind === "shipment" &&
              shipment.operator === "meest" &&
              Boolean(shipment.ttn) &&
              fallbackActionable;
            const isDeletingDraft =
              deleteDraftMutation.isPending &&
              deleteDraftMutation.variables === shipment.draftId;
            const isDeletingShipment =
              (deleteShipmentMutation.isPending &&
                deleteShipmentMutation.variables === shipment.ttn) ||
              (deleteUkrposhtaMutation.isPending &&
                deleteUkrposhtaMutation.variables === shipment.ttn) ||
              (deleteMeestMutation.isPending &&
                deleteMeestMutation.variables === shipment.ttn);

            return (
              <div className="flex w-fit items-center justify-end gap-1">
                <IconButton
                  aria-label="View shipment"
                  variant="ghost"
                  color="info"
                  size="sm"
                  disabled={!canView}
                  title={
                    canView
                      ? "Open shipment details"
                      : "Details are not available for drafts"
                  }
                  onClick={() => {
                    if (shipment.kind === "shipment" && shipment.ref) {
                      navigate(`/shipments/${shipment.operator}/${shipment.ref}`);
                    }
                  }}
                >
                  <Eye size={14} />
                </IconButton>
                <IconButton
                  aria-label="Duplicate shipment"
                  variant="ghost"
                  color="success"
                  size="sm"
                  disabled={!canDuplicate}
                  title={canDuplicate ? "Duplicate shipment" : "Cannot duplicate this shipment"}
                  onClick={() => {
                    if (!canDuplicate || !shipment.ttn) return;
                    navigate({
                      pathname: APP_ROUTES.newShipment,
                      search: `?duplicate=${encodeURIComponent(shipment.ttn)}`,
                    });
                  }}
                >
                  <Copy size={14} />
                </IconButton>
                <IconButton
                  aria-label="Edit shipment"
                  variant="ghost"
                  color="warning"
                  size="sm"
                  disabled={!canEdit}
                  title={canEdit ? "Edit shipment" : "Cannot edit this shipment"}
                  onClick={() => {
                    if (!canEdit) return;

                    if (shipment.kind === "draft" && shipment.draftId != null) {
                      navigate({
                        pathname: APP_ROUTES.newShipment,
                        search: `?draftId=${shipment.draftId}`,
                      });
                      return;
                    }

                    if (shipment.kind === "shipment" && shipment.ttn) {
                      navigate({
                        pathname: APP_ROUTES.newShipment,
                        search: `?editTtn=${encodeURIComponent(shipment.ttn)}&operator=${encodeURIComponent(shipment.operator)}`,
                      });
                    }
                  }}
                >
                  <Pencil size={14} />
                </IconButton>
                {canDeleteDraft ? (
                  <AlertDialog color="error">
                    <AlertDialogTrigger asChild>
                      <IconButton
                        aria-label="Delete draft"
                        variant="ghost"
                        color="error"
                        size="sm"
                        disabled={isDeletingDraft}
                        title={isDeletingDraft ? "Deleting draft" : "Delete draft"}
                      >
                        <Trash2 size={14} />
                      </IconButton>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogTitle>Delete draft?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This draft will be permanently removed. This action
                        cannot be undone.
                      </AlertDialogDescription>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteDraft(shipment.draftId!)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : canDeleteNovaPost ? (
                  <AlertDialog color="error">
                    <AlertDialogTrigger asChild>
                      <IconButton
                        aria-label="Delete shipment"
                        variant="ghost"
                        color="error"
                        size="sm"
                        disabled={isDeletingShipment}
                        title={isDeletingShipment ? "Deleting shipment" : "Delete shipment"}
                      >
                        <Trash2 size={14} />
                      </IconButton>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogTitle>Delete shipment?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete the shipment from Nova
                        Poshta. This action cannot be undone.
                      </AlertDialogDescription>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteNovaPoshtaShipment(shipment.ttn!)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : canDeleteUkrposhta ? (
                  <AlertDialog color="error">
                    <AlertDialogTrigger asChild>
                      <IconButton
                        aria-label="Delete shipment"
                        variant="ghost"
                        color="error"
                        size="sm"
                        disabled={isDeletingShipment}
                        title={isDeletingShipment ? "Deleting shipment" : "Delete shipment"}
                      >
                        <Trash2 size={14} />
                      </IconButton>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogTitle>Delete shipment?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete the shipment from
                        Ukrposhta. This action cannot be undone.
                      </AlertDialogDescription>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteUkrposhtaShipment(shipment.ttn!)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : canDeleteMeest ? (
                  <AlertDialog color="error">
                    <AlertDialogTrigger asChild>
                      <IconButton
                        aria-label="Delete shipment"
                        variant="ghost"
                        color="error"
                        size="sm"
                        disabled={isDeletingShipment}
                        title={isDeletingShipment ? "Deleting shipment" : "Delete shipment"}
                      >
                        <Trash2 size={14} />
                      </IconButton>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogTitle>Delete shipment?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete the shipment from Meest
                        Express. This action cannot be undone.
                      </AlertDialogDescription>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteMeestShipment(shipment.ttn!)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : (
                  <IconButton
                    aria-label="Delete shipment"
                    variant="ghost"
                    color="error"
                    size="sm"
                    disabled
                    title="Delete is only available for drafts"
                  >
                    <Trash2 size={14} />
                  </IconButton>
                )}
              </div>
            );
          },
        }
      : column,
  );
  const sortableColumnIds = new Set(
    columns.filter((column) => column.sortable).map((column) => column.id),
  );
  const effectiveSortState =
    sortState && sortableColumnIds.has(sortState.columnId) ? sortState : null;

  const apiParams: ShipmentQueryParams = {
    ttn: filterState["ttn"] || undefined,
    operator: filterState["operator"] || undefined,
    status: (filterState["status"] as ShipmentStatus) || undefined,
    recipient: filterState["recipient"] || undefined,
    createdFrom: filterState["createdFrom"] || undefined,
    createdTo: filterState["createdTo"] || undefined,
    valueFrom:
      filterState["valueFrom"] && !Number.isNaN(Number(filterState["valueFrom"]))
        ? Number(filterState["valueFrom"])
        : undefined,
    valueTo:
      filterState["valueTo"] && !Number.isNaN(Number(filterState["valueTo"]))
        ? Number(filterState["valueTo"])
        : undefined,
    sortBy: effectiveSortState?.columnId,
    sortDir: effectiveSortState?.direction,
    page,
    limit: PAGE_SIZE,
  };

  const { data, isLoading, error } = useShipmentsQuery(apiParams);
  const shipments = data?.items ?? [];
  const meta = data?.meta;

  return (
    <main className="py-10">
      <DataTable
        columns={columns}
        data={shipments}
        getRowKey={(s) => s.ref ?? String(s.draftId)}
        page={page}
        pageSize={PAGE_SIZE}
        totalRows={meta?.totalItems ?? 0}
        onPageChange={setPage}
        sortState={effectiveSortState}
        onSortChange={setSortState}
        filterState={filterState}
        onFilterChange={setFilterState}
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={setColumnVisibility}
        isLoading={isLoading}
        error={error ? "Failed to load shipments." : null}
        emptyMessage="No shipments yet"
        priorityFilterIds={["ttn", "operator", "status", "recipient"]}
        extraFilterContent={
          <>
            <div className="flex min-w-44 flex-1 flex-col gap-1">
              <span className="text-xs font-medium text-neutral-500">
                Created in SendIt from
              </span>
              <DatePicker
                value={createdFrom}
                onChange={(date) =>
                  setFilterState({
                    ...filterState,
                    createdFrom: date ? formatDateParam(date) : "",
                  })
                }
                placeholder="Start date"
                className="h-8 rounded border border-neutral-200 px-2 text-xs"
              />
            </div>
            <div className="flex min-w-44 flex-1 flex-col gap-1">
              <span className="text-xs font-medium text-neutral-500">
                Created in SendIt to
              </span>
              <DatePicker
                value={createdTo}
                onChange={(date) =>
                  setFilterState({
                    ...filterState,
                    createdTo: date ? formatDateParam(date) : "",
                  })
                }
                placeholder="End date"
                className="h-8 rounded border border-neutral-200 px-2 text-xs"
              />
            </div>
            <div className="flex min-w-44 flex-1 flex-col gap-1">
              <span className="text-xs font-medium text-neutral-500">
                Value from
              </span>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={filterState["valueFrom"] ?? ""}
                onChange={(event) =>
                  setFilterState({
                    ...filterState,
                    valueFrom: event.target.value,
                  })
                }
                placeholder="Min value"
                className="h-8 rounded border border-neutral-200 px-2 text-xs"
              />
            </div>
            <div className="flex min-w-44 flex-1 flex-col gap-1">
              <span className="text-xs font-medium text-neutral-500">
                Value to
              </span>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={filterState["valueTo"] ?? ""}
                onChange={(event) =>
                  setFilterState({
                    ...filterState,
                    valueTo: event.target.value,
                  })
                }
                placeholder="Max value"
                className="h-8 rounded border border-neutral-200 px-2 text-xs"
              />
            </div>
            <div className="min-w-full text-xs text-neutral-500">
              Value filters apply to the shipment declared value, not the
              delivery fee.
            </div>
          </>
        }
        onResetState={resetTableState}
        title="Shipments"
        description="Track and manage all your shipments."
        tableActions={
          <Button
            color="green"
            onClick={() => navigate(APP_ROUTES.newShipment)}
          >
            New shipment
          </Button>
        }
      />
    </main>
  );
}
