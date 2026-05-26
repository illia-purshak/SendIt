import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAdminTicketsQuery, useAdminUpdateTicketMutation } from "@/api/admin-support";
import { APP_ROUTES } from "@/constants/app-routes";
import { Button } from "@/components/Button";
import { DataTable, useDataTableUrlState } from "@/components/DataTable";
import type { ColumnDef } from "@/components/DataTable";
import { toastStore } from "@/store/toastStore";
import type { SupportTicketCategory, SupportTicketListItem, SupportTicketStatus } from "@/types/support";
import {
  formatSupportTimestamp,
  getAdminDisplayName,
  getSupportCategoryClass,
  getSupportCategoryLabel,
  getSupportStatusClass,
  getSupportStatusLabel,
} from "@/views/support/support-meta";

const PAGE_SIZE = 25;

const STATUS_FILTER_OPTIONS = [
  { value: "WAITING", label: "Waiting" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "CLOSED", label: "Closed" },
  { value: "ALL", label: "All" },
];

const CATEGORY_FILTER_OPTIONS = [
  { value: "ALL", label: "All" },
  { value: "QUESTION", label: "Question" },
  { value: "TECHNICAL", label: "Technical" },
  { value: "BILLING", label: "Billing" },
  { value: "SUGGESTION", label: "Suggestion" },
  { value: "OTHER", label: "Other" },
];

const BASE_COLUMNS: ColumnDef<SupportTicketListItem>[] = [
  {
    id: "client",
    header: "Client",
    cell: (ticket) => (
      <div className="flex flex-col">
        <span className="font-medium text-neutral-900">
          {ticket.user.profile.companyName || "Client"}
        </span>
        <span className="text-xs text-neutral-500">{ticket.user.email}</span>
      </div>
    ),
    minWidth: 220,
  },
  {
    id: "subject",
    header: "Subject",
    cell: (ticket) => (
      <span className="font-medium text-neutral-900">{ticket.subject}</span>
    ),
    minWidth: 220,
  },
  {
    id: "category",
    header: "Category",
    cell: (ticket) => (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getSupportCategoryClass(ticket.category)}`}
      >
        {getSupportCategoryLabel(ticket.category)}
      </span>
    ),
    filterable: true,
    filterType: "select",
    filterOptions: CATEGORY_FILTER_OPTIONS,
    width: 140,
  },
  {
    id: "status",
    header: "Status",
    cell: (ticket) => (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getSupportStatusClass(ticket.status)}`}
      >
        {getSupportStatusLabel(ticket.status)}
      </span>
    ),
    filterable: true,
    filterType: "select",
    filterOptions: STATUS_FILTER_OPTIONS,
    width: 140,
  },
  {
    id: "assignedTo",
    header: "Assigned to",
    cell: (ticket) => (
      <span className="text-neutral-600">
        {ticket.assignedAdmin ? getAdminDisplayName(ticket.assignedAdmin) : "Unassigned"}
      </span>
    ),
    width: 180,
  },
  {
    id: "createdAt",
    header: "Created at",
    cell: (ticket) => (
      <span className="text-neutral-500">{formatSupportTimestamp(ticket.createdAt)}</span>
    ),
    width: 170,
  },
  {
    id: "actions",
    header: "Actions",
    cell: () => null,
    hideable: false,
    width: 180,
  },
];

export default function AdminSupportPage() {
  const navigate = useNavigate();
  const updateTicket = useAdminUpdateTicketMutation();
  const {
    urlState,
    setFilterState,
    setPage,
    setColumnVisibility,
    resetTableState,
  } = useDataTableUrlState({
    initialState: {
      page: 1,
      filterState: { status: "WAITING" },
      columnVisibility: {},
    },
  });

  const statusFilter = urlState.filterState["status"];
  const categoryFilter = urlState.filterState["category"];
  const [searchInput, setSearchInput] = useState(urlState.filterState["search"] ?? "");

  useEffect(() => {
    setSearchInput(urlState.filterState["search"] ?? "");
  }, [urlState.filterState]);

  useEffect(() => {
    const t = setTimeout(() => {
      setFilterState({ ...urlState.filterState, search: searchInput });
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]); // eslint-disable-line react-hooks/exhaustive-deps

  const { data, isLoading, error } = useAdminTicketsQuery({
    status:
      statusFilter && statusFilter !== "ALL"
        ? (statusFilter as Exclude<SupportTicketStatus, "OPEN">)
        : undefined,
    category:
      categoryFilter && categoryFilter !== "ALL"
        ? (categoryFilter as SupportTicketCategory)
        : undefined,
    search: (urlState.filterState["search"] ?? "").trim() || undefined,
    assigned: "all",
    page: urlState.page,
    limit: PAGE_SIZE,
  });

  async function handleAssign(ticketId: number) {
    try {
      await updateTicket.mutateAsync({ id: ticketId, action: "assign" });
      toastStore.toast({ title: "Ticket assigned", color: "success" });
      navigate(`${APP_ROUTES.admin.mySupport}?ticketId=${ticketId}`);
    } catch (err) {
      toastStore.toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to assign ticket",
        color: "error",
      });
    }
  }

  const columns = useMemo<ColumnDef<SupportTicketListItem>[]>(
    () =>
      BASE_COLUMNS.map((column) =>
        column.id === "actions"
          ? {
              ...column,
              cell: (ticket) => {
                const isAssigning =
                  updateTicket.isPending && updateTicket.variables?.id === ticket.id;

                return (
                  <div className="flex items-center justify-end gap-2">
                    {ticket.status === "WAITING" && !ticket.assignedAdmin && (
                      <Button
                        size="sm"
                        variant="outline"
                        color="neutral"
                        disabled={isAssigning}
                        onClick={(event) => {
                          event.stopPropagation();
                          void handleAssign(ticket.id);
                        }}
                      >
                        Assign to me
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      color="neutral"
                      onClick={(event) => {
                        event.stopPropagation();
                        navigate(`${APP_ROUTES.admin.mySupport}?ticketId=${ticket.id}`);
                      }}
                    >
                      <ArrowUpRight size={14} className="mr-1" />
                      Open
                    </Button>
                  </div>
                );
              },
            }
          : column,
      ),
    [navigate, updateTicket.isPending, updateTicket.variables],
  );

  return (
    <main className="py-10">
      <DataTable
        columns={columns}
        data={data?.items ?? []}
        getRowKey={(ticket) => ticket.id}
        page={urlState.page}
        pageSize={PAGE_SIZE}
        totalRows={data?.meta.totalItems ?? 0}
        onPageChange={setPage}
        filterState={urlState.filterState}
        onFilterChange={setFilterState}
        columnVisibility={urlState.columnVisibility}
        onColumnVisibilityChange={setColumnVisibility}
        isLoading={isLoading}
        error={error ? "Failed to load support tickets." : null}
        emptyMessage="No tickets found for the current filters."
        title="Support"
        description="All support tickets across the platform, starting with the oldest waiting requests."
        priorityFilterIds={["status", "category"]}
        extraFilterContent={
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by subject or company..."
            className="h-9 rounded-md border border-neutral-200 px-3 text-sm text-neutral-800 placeholder:text-neutral-400 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
          />
        }
        onResetState={resetTableState}
      />
    </main>
  );
}
