import { useNavigate } from "react-router-dom";
import { Pencil, Play, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { APP_ROUTES } from "@/constants/app-routes";
import { Button } from "@/components/Button";
import { IconButton } from "@/components/IconButton";
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
import { DataTable, useDataTableUrlState } from "@/components/DataTable";
import type { ColumnDef } from "@/components/DataTable";
import { useTemplatesQuery, useDeleteTemplateMutation } from "@/api/templates";
import { usePostalConnectionsQuery } from "@/api/postal-connections";
import { toastStore } from "@/store/toastStore";
import type { Template, ShipmentType, TemplateQueryParams } from "@/types/template";

export default function TemplatesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    urlState,
    setSortState,
    setFilterState,
    setPage,
    setColumnVisibility,
    resetTableState,
  } = useDataTableUrlState();

  const { data: connectionsData } = usePostalConnectionsQuery();
  const deleteMutation = useDeleteTemplateMutation();

  const queryParams: TemplateQueryParams = {
    page: urlState.page,
    limit: 25,
    search: urlState.filterState["name"] || undefined,
    operator: urlState.filterState["postalService"] || undefined,
    shipmentType: urlState.filterState["shipmentType"] as ShipmentType || undefined,
    sortBy: urlState.sortState?.columnId as "name" | "createdAt" | undefined,
    sortOrder: urlState.sortState?.direction,
  };

  const { data, isLoading, error } = useTemplatesQuery(queryParams);

  async function handleDelete(id: number) {
    try {
      await deleteMutation.mutateAsync(id);
      toastStore.toast({ title: t("templatesPage.templateDeleted"), color: "success" });
    } catch (err) {
      toastStore.toast({
        title: t("common.error"),
        description: err instanceof Error ? err.message : t("templatesPage.failedToDelete"),
        color: "error",
      });
    }
  }

  const operatorFilterOptions = (connectionsData?.connections ?? []).map((c) => ({
    label: c.postalService.name,
    value: c.postalService.slug,
  }));

  const shipmentTypeLabel: Record<ShipmentType, string> = {
    DOCUMENT: t("templatesPage.shipmentType.document"),
    PACKAGE: t("templatesPage.shipmentType.package"),
    BOX: t("templatesPage.shipmentType.box"),
    CARGO: t("templatesPage.shipmentType.cargo"),
    PALLET: t("templatesPage.shipmentType.pallet"),
    UNKNOWN: t("templatesPage.shipmentType.other"),
  };

  const columns: ColumnDef<Template>[] = [
    {
      id: "name",
      header: t("templatesPage.columns.name"),
      cell: (row) => row.name,
      sortable: true,
      filterable: true,
      filterType: "text",
      minWidth: 180,
    },
    {
      id: "shipmentType",
      header: t("templatesPage.columns.type"),
      cell: (row) => (
        <span className="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-600">
          {shipmentTypeLabel[row.shipmentType] ?? row.shipmentType}
        </span>
      ),
      filterable: true,
      filterType: "select",
      filterOptions: [
        { label: t("templatesPage.shipmentType.document"), value: "DOCUMENT" },
        { label: t("templatesPage.shipmentType.package"), value: "PACKAGE" },
        { label: t("templatesPage.shipmentType.box"), value: "BOX" },
        { label: t("templatesPage.shipmentType.cargo"), value: "CARGO" },
        { label: t("templatesPage.shipmentType.pallet"), value: "PALLET" },
        { label: t("templatesPage.shipmentType.other"), value: "UNKNOWN" },
      ],
      width: 120,
    },
    {
      id: "postalService",
      header: t("templatesPage.columns.service"),
      cell: (row) => row.postalService.name,
      filterable: true,
      filterType: "select",
      filterOptions: operatorFilterOptions,
      width: 160,
    },
    {
      id: "usageCount",
      header: t("templatesPage.columns.used"),
      cell: (row) => t("templatesPage.usedTimes", { count: row.usageCount }),
      width: 100,
    },
    {
      id: "createdAt",
      header: t("templatesPage.columns.created"),
      cell: (row) => new Date(row.createdAt).toLocaleDateString(),
      sortable: true,
      width: 120,
    },
    {
      id: "actions",
      header: t("templatesPage.columns.actions"),
      cell: (row) => (
        <div className="flex items-center justify-end gap-1">
          <IconButton
            aria-label={t("templatesPage.actions.use")}
            variant="ghost"
            color="teal"
            size="sm"
            title={t("templatesPage.actions.use")}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`${APP_ROUTES.newShipment}?templateId=${row.id}`);
            }}
          >
            <Play size={14} />
          </IconButton>
          <IconButton
            aria-label={t("templatesPage.actions.edit")}
            variant="ghost"
            color="warning"
            size="sm"
            title={t("templatesPage.actions.edit")}
            onClick={(e) => {
              e.stopPropagation();
              navigate(APP_ROUTES.editTemplate.replace(":id", String(row.id)));
            }}
          >
            <Pencil size={14} />
          </IconButton>
          <AlertDialog color="error">
            <AlertDialogTrigger asChild>
              <IconButton
                aria-label={t("templatesPage.actions.delete")}
                variant="ghost"
                color="error"
                size="sm"
                title={t("templatesPage.actions.delete")}
                disabled={deleteMutation.isPending && deleteMutation.variables === row.id}
                onClick={(e) => e.stopPropagation()}
              >
                <Trash2 size={14} />
              </IconButton>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogTitle>{t("templatesPage.deleteTitle")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("templatesPage.deleteDescription", { name: row.name })}
              </AlertDialogDescription>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleDelete(row.id)}>
                  {t("templatesPage.actions.delete")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ),
      hideable: false,
      width: 200,
    },
  ];

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <DataTable
        columns={columns}
        data={data?.items ?? []}
        getRowKey={(row) => row.id}
        page={urlState.page}
        pageSize={25}
        totalRows={data?.meta.totalItems ?? 0}
        onPageChange={setPage}
        sortState={urlState.sortState}
        onSortChange={setSortState}
        filterState={urlState.filterState}
        onFilterChange={setFilterState}
        columnVisibility={urlState.columnVisibility}
        onColumnVisibilityChange={setColumnVisibility}
        isLoading={isLoading}
        error={error instanceof Error ? error.message : null}
        emptyMessage={t("templatesPage.empty")}
        title={t("templatesPage.title")}
        description={t("templatesPage.description")}
        tableActions={
          <Button color="teal" onClick={() => navigate(APP_ROUTES.newTemplate)}>
            {t("templatesPage.newTemplate")}
          </Button>
        }
        priorityFilterIds={["name", "shipmentType", "postalService"]}
        onResetState={resetTableState}
      />
    </main>
  );
}
