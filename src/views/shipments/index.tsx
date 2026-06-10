import { useNavigate } from "react-router-dom";
import { Copy, Eye, Pencil, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
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
  useDeleteShipmentMutation,
  useShipmentsQuery,
} from "@/api/shipments";
import type {
  ShipmentListItem,
  ShipmentQueryParams,
  ShipmentStatus,
} from "@/types/shipment";
import { DataTable, useDataTableUrlState } from "@/components/DataTable";
import type { ColumnDef } from "@/components/DataTable";

const STATUS_CLASS: Record<ShipmentStatus, string> = {
  DRAFT: "bg-neutral-100 text-neutral-500",
  CREATED: "bg-blue-50 text-blue-700",
  PREPARING: "bg-yellow-100 text-yellow-800",
  IN_TRANSIT: "bg-blue-100 text-blue-800",
  DELIVERED: "bg-teal-100 text-teal-800",
  CANCELLED: "bg-neutral-100 text-neutral-500",
  RETURNED: "bg-orange-100 text-orange-700",
  UNKNOWN: "bg-neutral-100 text-neutral-400",
};

const PAGE_SIZE = 20;

const ACTIONABLE_STATUSES = new Set<ShipmentStatus>(["DRAFT", "CREATED", "PREPARING"]);

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

export default function ShipmentsPage() {
  const { t } = useTranslation();
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
  const deleteShipmentMutation = useDeleteShipmentMutation();

  const createdFrom = parseDateParam(filterState["createdFrom"]);
  const createdTo = parseDateParam(filterState["createdTo"]);

  const statusLabel: Record<ShipmentStatus, string> = {
    DRAFT: t("shipmentsPage.status.draft"),
    CREATED: t("shipmentsPage.status.created"),
    PREPARING: t("shipmentsPage.status.preparing"),
    IN_TRANSIT: t("shipmentsPage.status.inTransit"),
    DELIVERED: t("shipmentsPage.status.delivered"),
    CANCELLED: t("shipmentsPage.status.cancelled"),
    RETURNED: t("shipmentsPage.status.returned"),
    UNKNOWN: t("shipmentsPage.status.unknown"),
  };

  const statusFilterOptions = Object.entries(statusLabel).map(
    ([value, label]) => ({ value, label }),
  );

  async function handleDeleteShipment(operator: string, ref: string) {
    try {
      await deleteShipmentMutation.mutateAsync({ operator, ref });
      toast({ title: t("shipmentsPage.shipmentDeleted"), color: "success" });
    } catch (err) {
      if (err instanceof ConnectionInvalidError) {
        toast({
          title: t("shipmentsPage.connectionInvalidTitle"),
          description: t("shipmentsPage.connectionInvalidDescription"),
          color: "error",
        });
      } else {
        toast({
          title: t("shipmentsPage.failedToDeleteShipment"),
          description: err instanceof Error ? err.message : t("shipmentsPage.tryAgain"),
          color: "error",
        });
      }
    }
  }

  async function handleDeleteDraft(draftId: number) {
    try {
      await deleteDraftMutation.mutateAsync(draftId);
      toast({ title: t("shipmentsPage.draftDeleted"), color: "success" });
    } catch (err) {
      toast({
        title: t("shipmentsPage.failedToDeleteDraft"),
        description: err instanceof Error ? err.message : t("shipmentsPage.tryAgain"),
        color: "error",
      });
    }
  }

  const baseColumns: ColumnDef<ShipmentListItem>[] = [
    {
      id: "ttn",
      header: t("shipmentsPage.columns.ttn"),
      cell: (s) => (
        <span className="font-mono text-xs text-neutral-700">
          {s.ttn ?? (s.draftId != null ? t("shipmentsPage.draftNumber", { id: s.draftId }) : t("shipmentsPage.dash"))}
        </span>
      ),
      filterable: true,
      filterType: "text",
      width: 160,
    },
    {
      id: "operator",
      header: t("shipmentsPage.columns.operator"),
      cell: (s) => s.operatorName,
      filterable: true,
      filterType: "select",
      filterOptions: OPERATOR_FILTER_OPTIONS,
      width: 140,
    },
    {
      id: "recipient",
      header: t("shipmentsPage.columns.recipient"),
      cell: (s) => s.recipientName ?? t("shipmentsPage.dash"),
      sortable: true,
      filterable: true,
      filterType: "text",
    },
    {
      id: "status",
      header: t("shipmentsPage.columns.status"),
      cell: (s) => (
        <span
          className={[
            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
            STATUS_CLASS[s.normalizedStatus],
          ].join(" ")}
        >
          {statusLabel[s.normalizedStatus]}
        </span>
      ),
      filterable: true,
      filterType: "select",
      filterOptions: statusFilterOptions,
      width: 140,
    },
    {
      id: "createdAt",
      header: t("shipmentsPage.columns.date"),
      cell: (s) => new Date(s.createdAt).toLocaleDateString(),
      sortable: true,
      width: 110,
    },
    {
      id: "declaredValue",
      header: t("shipmentsPage.columns.value"),
      cell: (s) => (s.declaredValue != null ? s.declaredValue : t("shipmentsPage.dash")),
      sortable: true,
      width: 100,
    },
    {
      id: "actions",
      header: t("shipmentsPage.columns.actions"),
      cell: () => null,
      hideable: false,
      width: 1,
    },
  ];

  const columns: ColumnDef<ShipmentListItem>[] = baseColumns.map((column) =>
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
              deleteShipmentMutation.isPending &&
              deleteShipmentMutation.variables?.ref === shipment.ttn;

            return (
              <div className="flex w-fit items-center justify-end gap-1">
                <IconButton
                  aria-label={t("shipmentsPage.actions.view")}
                  variant="ghost"
                  color="info"
                  size="sm"
                  disabled={!canView}
                  title={
                    canView
                      ? t("shipmentsPage.actions.openDetails")
                      : t("shipmentsPage.actions.detailsUnavailable")
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
                  aria-label={t("shipmentsPage.actions.duplicate")}
                  variant="ghost"
                  color="success"
                  size="sm"
                  disabled={!canDuplicate}
                  title={canDuplicate ? t("shipmentsPage.actions.duplicate") : t("shipmentsPage.actions.cannotDuplicate")}
                  onClick={() => {
                    if (!canDuplicate || !shipment.ttn) return;
                    navigate({
                      pathname: APP_ROUTES.newShipment,
                      search: `?duplicate=${encodeURIComponent(shipment.ttn)}&operator=${encodeURIComponent(shipment.operator)}`,
                    }, {
                      state: {
                        shipmentPrefillData: shipment,
                      },
                    });
                  }}
                >
                  <Copy size={14} />
                </IconButton>
                <IconButton
                  aria-label={t("shipmentsPage.actions.edit")}
                  variant="ghost"
                  color="warning"
                  size="sm"
                  disabled={!canEdit}
                  title={canEdit ? t("shipmentsPage.actions.edit") : t("shipmentsPage.actions.cannotEdit")}
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
                      }, {
                        state: {
                          shipmentPrefillData: shipment,
                        },
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
                        aria-label={t("shipmentsPage.actions.deleteDraft")}
                        variant="ghost"
                        color="error"
                        size="sm"
                        disabled={isDeletingDraft}
                        title={isDeletingDraft ? t("shipmentsPage.actions.deletingDraft") : t("shipmentsPage.actions.deleteDraft")}
                      >
                        <Trash2 size={14} />
                      </IconButton>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogTitle>{t("shipmentsPage.deleteDraftTitle")}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t("shipmentsPage.deleteDraftDescription")}
                      </AlertDialogDescription>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteDraft(shipment.draftId!)}
                        >
                          {t("shipmentsPage.actions.delete")}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : (canDeleteNovaPost || canDeleteUkrposhta || canDeleteMeest) ? (
                  <AlertDialog color="error">
                    <AlertDialogTrigger asChild>
                      <IconButton
                        aria-label={t("shipmentsPage.actions.deleteShipment")}
                        variant="ghost"
                        color="error"
                        size="sm"
                        disabled={isDeletingShipment}
                        title={isDeletingShipment ? t("shipmentsPage.actions.deletingShipment") : t("shipmentsPage.actions.deleteShipment")}
                      >
                        <Trash2 size={14} />
                      </IconButton>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogTitle>{t("shipmentsPage.deleteShipmentTitle")}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t("shipmentsPage.deleteShipmentDescription")}
                      </AlertDialogDescription>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteShipment(shipment.operator, shipment.ttn!)}
                        >
                          {t("shipmentsPage.actions.delete")}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : (
                  <IconButton
                    aria-label={t("shipmentsPage.actions.deleteShipment")}
                    variant="ghost"
                    color="error"
                    size="sm"
                    disabled
                    title={t("shipmentsPage.actions.deleteOnlyDrafts")}
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
        error={error ? t("shipmentsPage.failedToLoad") : null}
        emptyMessage={t("shipmentsPage.empty")}
        priorityFilterIds={["ttn", "operator", "status", "recipient"]}
        extraFilterContent={
          <>
            <div className="flex min-w-44 flex-1 flex-col gap-1">
              <span className="text-xs font-medium text-neutral-500">
                {t("shipmentsPage.filters.createdFromLabel")}
              </span>
              <DatePicker
                value={createdFrom}
                onChange={(date) =>
                  setFilterState({
                    ...filterState,
                    createdFrom: date ? formatDateParam(date) : "",
                  })
                }
                placeholder={t("shipmentsPage.filters.startDate")}
                className="h-8 rounded border border-neutral-200 px-2 text-xs"
              />
            </div>
            <div className="flex min-w-44 flex-1 flex-col gap-1">
              <span className="text-xs font-medium text-neutral-500">
                {t("shipmentsPage.filters.createdToLabel")}
              </span>
              <DatePicker
                value={createdTo}
                onChange={(date) =>
                  setFilterState({
                    ...filterState,
                    createdTo: date ? formatDateParam(date) : "",
                  })
                }
                placeholder={t("shipmentsPage.filters.endDate")}
                className="h-8 rounded border border-neutral-200 px-2 text-xs"
              />
            </div>
            <div className="flex min-w-44 flex-1 flex-col gap-1">
              <span className="text-xs font-medium text-neutral-500">
                {t("shipmentsPage.filters.valueFromLabel")}
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
                placeholder={t("shipmentsPage.filters.minValue")}
                className="h-8 rounded border border-neutral-200 px-2 text-xs"
              />
            </div>
            <div className="flex min-w-44 flex-1 flex-col gap-1">
              <span className="text-xs font-medium text-neutral-500">
                {t("shipmentsPage.filters.valueToLabel")}
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
                placeholder={t("shipmentsPage.filters.maxValue")}
                className="h-8 rounded border border-neutral-200 px-2 text-xs"
              />
            </div>
            <div className="min-w-full text-xs text-neutral-500">
              {t("shipmentsPage.filters.valueHint")}
            </div>
          </>
        }
        onResetState={resetTableState}
        title={t("shipmentsPage.title")}
        description={t("shipmentsPage.description")}
        tableActions={
          <Button
            color="teal"
            onClick={() => navigate(APP_ROUTES.newShipment)}
          >
            {t("shipmentsPage.newShipment")}
          </Button>
        }
      />
    </main>
  );
}
