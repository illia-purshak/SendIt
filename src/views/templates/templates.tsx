import { useNavigate } from "react-router-dom";
import { Pencil, Trash2 } from "lucide-react";
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

const shipmentTypeLabel: Record<ShipmentType, string> = {
  DOCUMENT: "Document",
  PACKAGE: "Package",
  BOX: "Box",
  CARGO: "Cargo",
  PALLET: "Pallet",
  UNKNOWN: "Other",
};

export default function TemplatesPage() {
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
      toastStore.toast({ title: "Template deleted", color: "success" });
    } catch (err) {
      toastStore.toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete template",
        color: "error",
      });
    }
  }

  const operatorFilterOptions = (connectionsData?.connections ?? []).map((c) => ({
    label: c.postalService.name,
    value: c.postalService.slug,
  }));

  const columns: ColumnDef<Template>[] = [
    {
      id: "name",
      header: "Name",
      cell: (row) => row.name,
      sortable: true,
      filterable: true,
      filterType: "text",
      minWidth: 180,
    },
    {
      id: "shipmentType",
      header: "Type",
      cell: (row) => (
        <span className="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-600">
          {shipmentTypeLabel[row.shipmentType] ?? row.shipmentType}
        </span>
      ),
      filterable: true,
      filterType: "select",
      filterOptions: [
        { label: "Document", value: "DOCUMENT" },
        { label: "Package", value: "PACKAGE" },
        { label: "Box", value: "BOX" },
        { label: "Cargo", value: "CARGO" },
        { label: "Pallet", value: "PALLET" },
        { label: "Other", value: "UNKNOWN" },
      ],
      width: 120,
    },
    {
      id: "postalService",
      header: "Service",
      cell: (row) => row.postalService.name,
      filterable: true,
      filterType: "select",
      filterOptions: operatorFilterOptions,
      width: 160,
    },
    {
      id: "usageCount",
      header: "Used",
      cell: (row) => `${row.usageCount} time${row.usageCount !== 1 ? "s" : ""}`,
      width: 100,
    },
    {
      id: "createdAt",
      header: "Created",
      cell: (row) => new Date(row.createdAt).toLocaleDateString(),
      sortable: true,
      width: 120,
    },
    {
      id: "actions",
      header: "Actions",
      cell: (row) => (
        <div className="flex items-center justify-end gap-1">
          <IconButton
            aria-label="Edit template"
            variant="ghost"
            color="warning"
            size="sm"
            title="Edit template"
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
                aria-label="Delete template"
                variant="ghost"
                color="error"
                size="sm"
                title="Delete template"
                disabled={deleteMutation.isPending && deleteMutation.variables === row.id}
                onClick={(e) => e.stopPropagation()}
              >
                <Trash2 size={14} />
              </IconButton>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogTitle>Delete template?</AlertDialogTitle>
              <AlertDialogDescription>
                "{row.name}" will be permanently removed. This cannot be undone.
              </AlertDialogDescription>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleDelete(row.id)}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ),
      hideable: false,
      width: 160,
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
        emptyMessage="No templates yet — create one to speed up shipment creation."
        title="Templates"
        description="Reusable shipment templates to speed up parcel creation."
        tableActions={
          <Button color="green" onClick={() => navigate(APP_ROUTES.newTemplate)}>
            New template
          </Button>
        }
        priorityFilterIds={["name", "shipmentType", "postalService"]}
        onResetState={resetTableState}
      />
    </main>
  );
}
