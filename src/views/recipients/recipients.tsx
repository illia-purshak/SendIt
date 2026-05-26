import { useMemo, useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/AlertDialog'
import { Button } from '@/components/Button'
import { IconButton } from '@/components/IconButton'
import { DataTable, useDataTableUrlState } from '@/components/DataTable'
import type { ColumnDef } from '@/components/DataTable'
import { useDeleteRecipientMutation, useRecipientsQuery } from '@/api/recipients'
import { useToast } from '@/components/Toast/use-toast'
import type { Recipient, RecipientType } from '@/types/recipient'
import { RecipientFormModal } from '@/views/recipients/RecipientFormModal'

const PAGE_SIZE = 20

const TYPE_FILTER_OPTIONS = [
  { value: 'INDIVIDUAL', label: 'Individual' },
  { value: 'ORGANIZATION', label: 'Organization' },
]

function formatRecipientName(recipient: Recipient): string {
  if (recipient.type === 'ORGANIZATION') {
    return recipient.companyName?.trim() || '-'
  }

  const fullName = [recipient.lastName, recipient.firstName, recipient.patronymic]
    .filter(Boolean)
    .join(' ')
    .trim()

  return fullName || '-'
}

function formatRecipientAddress(recipient: Recipient): string {
  if (!recipient.address) return '-'

  if (recipient.address.type === 'BRANCH') {
    return `${recipient.address.city} - Branch ${recipient.address.branchNumber ?? '-'}`
  }

  const streetParts = [
    recipient.address.city,
    recipient.address.street,
    recipient.address.building,
    recipient.address.flat ? `apt. ${recipient.address.flat}` : null,
    recipient.address.postCode,
  ].filter(Boolean)

  return streetParts.join(', ') || '-'
}

const COLUMNS: ColumnDef<Recipient>[] = [
  {
    id: 'name',
    header: 'Recipient',
    cell: (recipient) => (
      <div className="flex flex-col">
        <span className="font-medium text-neutral-900">{formatRecipientName(recipient)}</span>
        {recipient.email ? (
          <span className="text-xs text-neutral-500">{recipient.email}</span>
        ) : null}
      </div>
    ),
    sortable: true,
    filterable: true,
    filterType: 'text',
    minWidth: 220,
  },
  {
    id: 'phone',
    header: 'Phone',
    cell: (recipient) => recipient.phone,
    minWidth: 140,
  },
  {
    id: 'address',
    header: 'Address',
    cell: (recipient) => (
      <span className="text-sm text-neutral-700">{formatRecipientAddress(recipient)}</span>
    ),
    minWidth: 220,
  },
  {
    id: 'type',
    header: 'Type',
    cell: (recipient) => (
      <span className="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-600">
        {recipient.type === 'INDIVIDUAL' ? 'Individual' : 'Organization'}
      </span>
    ),
    filterable: true,
    filterType: 'select',
    filterOptions: TYPE_FILTER_OPTIONS,
    width: 140,
  },
  {
    id: 'createdAt',
    header: 'Created',
    cell: (recipient) => new Date(recipient.createdAt).toLocaleDateString(),
    sortable: true,
    width: 120,
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: () => null,
    hideable: false,
    width: 1,
  },
]

export default function RecipientsPage() {
  const { toast } = useToast()
  const {
    urlState,
    setSortState,
    setFilterState,
    setPage,
    setColumnVisibility,
    resetTableState,
  } = useDataTableUrlState()
  const { page, sortState, filterState, columnVisibility } = urlState
  const deleteRecipientMutation = useDeleteRecipientMutation()
  const [editingRecipientId, setEditingRecipientId] = useState<number | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const effectiveSortState =
    sortState?.columnId === 'name' || sortState?.columnId === 'createdAt'
      ? sortState
      : null

  const apiParams = useMemo(() => {
    const sortBy =
      effectiveSortState?.columnId === 'createdAt'
        ? 'createdAt'
        : effectiveSortState?.columnId === 'name'
          ? ((filterState.type as RecipientType | undefined) === 'ORGANIZATION'
              ? 'companyName'
              : 'lastName')
          : undefined

    return {
      search: filterState.name || undefined,
      type: (filterState.type as RecipientType) || undefined,
      sortBy,
      sortOrder: effectiveSortState?.direction,
      page,
      limit: PAGE_SIZE,
    } as const
  }, [effectiveSortState, filterState.name, filterState.type, page])

  const { data, isLoading, error } = useRecipientsQuery(apiParams)
  const recipients = data?.items ?? []
  const meta = data?.meta

  async function handleDelete(id: number) {
    try {
      await deleteRecipientMutation.mutateAsync(id)
      toast({ title: 'Recipient deleted', color: 'success' })
    } catch (err) {
      toast({
        title: 'Failed to delete recipient',
        description: err instanceof Error ? err.message : 'Please try again.',
        color: 'error',
      })
    }
  }

  const columns = useMemo<ColumnDef<Recipient>[]>(
    () =>
      COLUMNS.map((column) =>
        column.id === 'actions'
          ? {
              ...column,
              cell: (recipient) => {
                const isDeleting =
                  deleteRecipientMutation.isPending &&
                  deleteRecipientMutation.variables === recipient.id

                return (
                  <div className="flex w-fit items-center justify-end gap-1">
                    <IconButton
                      aria-label="Edit recipient"
                      variant="ghost"
                      color="warning"
                      size="sm"
                      title="Edit recipient"
                      onClick={() => {
                        setEditingRecipientId(recipient.id)
                        setIsModalOpen(true)
                      }}
                    >
                      <Pencil size={14} />
                    </IconButton>
                    <AlertDialog color="error">
                      <AlertDialogTrigger asChild>
                        <IconButton
                          aria-label="Delete recipient"
                          variant="ghost"
                          color="error"
                          size="sm"
                          title="Delete recipient"
                          disabled={isDeleting}
                        >
                          <Trash2 size={14} />
                        </IconButton>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogTitle>Delete recipient?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This recipient will be permanently removed from your address book.
                        </AlertDialogDescription>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(recipient.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )
              },
            }
          : column,
      ),
    [deleteRecipientMutation.isPending, deleteRecipientMutation.variables],
  )

  return (
    <main className="py-10">
      <DataTable
        columns={columns}
        data={recipients}
        getRowKey={(recipient) => recipient.id}
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
        error={error ? 'Failed to load recipients.' : null}
        emptyMessage="No recipients yet"
        priorityFilterIds={['name', 'type']}
        onResetState={resetTableState}
        title="Recipients"
        description="Your address book for faster shipment creation."
        tableActions={
          <Button
            color="green"
            onClick={() => {
              setEditingRecipientId(null)
              setIsModalOpen(true)
            }}
          >
            Add recipient
          </Button>
        }
      />

      <RecipientFormModal
        open={isModalOpen}
        recipientId={editingRecipientId}
        onClose={() => {
          setIsModalOpen(false)
          setEditingRecipientId(null)
        }}
      />
    </main>
  )
}
