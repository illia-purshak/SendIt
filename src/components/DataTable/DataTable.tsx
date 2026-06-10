import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ListFilter, RotateCcw } from "lucide-react";
import { DataTableCtx } from "./context";
import { DataTableColumnVisibilityDropdown } from "./DataTableColumnVisibilityDropdown";
import { DataTableFilterBar } from "./DataTableFilterBar";
import { DataTablePagination } from "./DataTablePagination";
import { DataTableScrollContainer } from "./DataTableScrollContainer";
import { DataTableToolbar } from "./DataTableToolbar";
import { useDataTableFilters } from "./hooks/useDataTableFilters";
import { useDataTableSorting } from "./hooks/useDataTableSorting";
import { useDataTableColumnVisibility } from "./hooks/useDataTableColumnVisibility";
import { TableBody } from "./table/TableBody";
import { TableHeader } from "./table/TableHeader";
import type { ColumnDef, ColumnRenderInfo, DataTableProps } from "./types";

function toRenderInfo<TRow>(col: ColumnDef<TRow>): ColumnRenderInfo {
  return {
    id: col.id,
    header: col.header,
    renderCell: (row) => col.cell(row as TRow),
    sortable: col.sortable ?? false,
    filterable: col.filterable ?? false,
    filterType: col.filterType ?? "text",
    filterOptions: col.filterOptions ?? [],
    width: col.width,
    minWidth: col.minWidth,
    hideable: col.hideable ?? true,
  };
}

interface FilterToggleButtonProps {
  active: boolean;
  onToggle: () => void;
  activeCount: number;
}

function FilterToggleButton({
  active,
  onToggle,
  activeCount,
}: FilterToggleButtonProps) {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      className={[
        "relative inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-1",
        active
          ? "border-green-500 bg-green-50 text-green-700"
          : "border-neutral-200 text-neutral-600 hover:bg-neutral-50 hover:text-neutral-800",
      ].join(" ")}
    >
      <ListFilter size={15} />
      {t("dataTable.filters")}
      {activeCount > 0 && (
        <span className="ml-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-green-500 px-1 text-xs font-bold text-white">
          {activeCount}
        </span>
      )}
    </button>
  );
}

export function DataTable<TRow>({
  columns,
  data,
  getRowKey,
  page,
  pageSize,
  totalRows,
  onPageChange,
  sortState,
  onSortChange,
  filterState,
  onFilterChange,
  columnVisibility,
  onColumnVisibilityChange,
  isLoading = false,
  error = null,
  emptyMessage = "No results",
  onRowClick,
  title,
  description,
  tableActions,
  priorityFilterIds,
  extraFilterContent,
  onResetState,
  className,
}: DataTableProps<TRow>) {
  const { t } = useTranslation();
  const sorting = useDataTableSorting({
    value: sortState,
    onChange: onSortChange,
  });
  const filters = useDataTableFilters({
    value: filterState,
    onChange: onFilterChange,
  });
  const visibility = useDataTableColumnVisibility({
    columns,
    value: columnVisibility,
    onChange: onColumnVisibilityChange,
  });

  const [showFilters, setShowFilters] = useState(false);

  const visibleColumns: ColumnRenderInfo[] = visibility.visibleColumns.map(
    (col) => toRenderInfo(col),
  );

  const hasFilterableColumns = columns.some((col) => col.filterable);
  const hasHideableColumns = columns.some((col) => col.hideable !== false);
  const activeFilterCount = Object.keys(filters.filterState).length;
  const hasActiveSort = Boolean(sorting.sortState);
  const canResetTableState = activeFilterCount > 0 || hasActiveSort;

  const handleResetState = () => {
    if (onResetState) {
      onResetState();
      return;
    }

    filters.clearAllFilters();
    sorting.clearSort();
  };

  return (
    <DataTableCtx.Provider
      value={{
        visibleColumns,
        sortState: sorting.sortState,
        handleSort: sorting.handleSort,
        filterState: filters.filterState,
        setFilter: filters.setFilter,
        clearFilter: filters.clearFilter,
        clearAllFilters: filters.clearAllFilters,
        onRowClick: onRowClick as ((row: unknown) => void) | undefined,
        isLoading,
        error: error ?? null,
        emptyMessage,
        data: data as unknown[],
        getRowKey: getRowKey as (row: unknown) => string | number,
        pageSize,
      }}
    >
      <div
        className={["flex flex-col gap-4", className].filter(Boolean).join(" ")}
      >
        <DataTableToolbar
          left={
            <>
              {(title || description) && (
                <div className="flex flex-col gap-0.5">
                  {title && (
                    <span className="text-base font-semibold text-neutral-900">
                      {title}
                    </span>
                  )}
                  {description && (
                    <span className="text-sm text-neutral-500">
                      {description}
                    </span>
                  )}
                </div>
              )}
            </>
          }
          right={
            <>
              {canResetTableState && (
                <button
                  type="button"
                  onClick={handleResetState}
                  className={[
                    "inline-flex h-9 items-center gap-2 rounded-md border border-neutral-200 px-3 text-sm text-neutral-600 transition-colors",
                    "hover:bg-neutral-50 hover:text-neutral-900",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-1",
                  ].join(" ")}
                >
                  <RotateCcw size={14} />
                  {t("dataTable.resetFilters")}
                </button>
              )}
              {hasFilterableColumns && (
                <FilterToggleButton
                  active={showFilters}
                  onToggle={() => setShowFilters((f) => !f)}
                  activeCount={activeFilterCount}
                />
              )}
              {hasHideableColumns && (
                <DataTableColumnVisibilityDropdown
                  columns={columns}
                  columnVisibility={visibility.columnVisibility}
                  onColumnVisibilityChange={visibility.setColumnVisibility}
                />
              )}
              {tableActions}
            </>
          }
        />
        {showFilters && (
          <DataTableFilterBar
            priorityFilterIds={priorityFilterIds}
            extraContent={extraFilterContent}
          />
        )}
        <DataTableScrollContainer>
          <table className="table-fixed min-w-full border-collapse text-sm">
            <TableHeader />
            <TableBody />
          </table>
        </DataTableScrollContainer>
        <DataTablePagination
          page={page}
          pageSize={pageSize}
          totalRows={totalRows}
          onPageChange={onPageChange}
        />
      </div>
    </DataTableCtx.Provider>
  );
}
