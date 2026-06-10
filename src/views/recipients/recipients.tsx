import { useMemo, useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
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

function formatRecipientName(recipient: Recipient, fallback: string): string {
  if (recipient.type === 'ORGANIZATION') {
    return recipient.companyName?.trim() || fallback
  }

  const fullName = [recipient.lastName, recipient.firstName, recipient.patronymic]
    .filter(Boolean)
    .join(' ')
    .trim()

  return fullName || fallback
}

function formatRecipientAddress(recipient: Recipient, t: (key: string, options?: Record<string, unknown>) => string): string {
  if (!recipient.address) return t('recipientsPage.dash')

  if (recipient.address.type === 'BRANCH') {
    return t('recipientsPage.branchAddress', {
      city: recipient.address.city,
      branchNumber: recipient.address.branchNumber ?? t('recipientsPage.dash'),
    })
  }

  const streetParts = [
    recipient.address.city,
    recipient.address.street,
    recipient.address.building,
    recipient.address.flat ? t('recipientsPage.apartment', { value: recipient.address.flat }) : null,
    recipient.address.postCode,
  ].filter(Boolean)

  return streetParts.join(', ') || t('recipientsPage.dash')
}

export default function RecipientsPage() {
  const { t } = useTranslation()
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

  const typeFilterOptions = useMemo(() => [
    { value: 'INDIVIDUAL', label: t('recipientsPage.type.individual') },
    { value: 'ORGANIZATION', label: t('recipientsPage.type.organization') },
  ], [t])

  const columns = useMemo<ColumnDef<Recipient>[]>(() => {
    async function handleDelete(id: number) {
      try {
        await deleteRecipientMutation.mutateAsync(id)
        toast({ title: t('recipientsPage.recipientDeleted'), color: 'success' })
      } catch (err) {
        toast({
          title: t('recipientsPage.failedToDelete'),
          description: err instanceof Error ? err.message : t('recipientsPage.tryAgain'),
          color: 'error',
        })
      }
    }

    const baseColumns: ColumnDef<Recipient>[] = [
      {
        id: 'name',
        header: t('recipientsPage.columns.recipient'),
        cell: (recipient) => (
          <div className="flex flex-col">
            <span className="font-medium text-neutral-900">
              {formatRecipientName(recipient, t('recipientsPage.dash'))}
            </span>
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
        header: t('recipientsPage.columns.phone'),
        cell: (recipient) => recipient.phone,
        minWidth: 140,
      },
      {
        id: 'address',
        header: t('recipientsPage.columns.address'),
        cell: (recipient) => (
          <span className="text-sm text-neutral-700">{formatRecipientAddress(recipient, t)}</span>
        ),
        minWidth: 220,
      },
      {
        id: 'type',
        header: t('recipientsPage.columns.type'),
        cell: (recipient) => (
          <span className="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-600">
            {recipient.type === 'INDIVIDUAL'
              ? t('recipientsPage.type.individual')
              : t('recipientsPage.type.organization')}
          </span>
        ),
        filterable: true,
        filterType: 'select',
        filterOptions: typeFilterOptions,
        width: 140,
      },
      {
        id: 'createdAt',
        header: t('recipientsPage.columns.created'),
        cell: (recipient) => new Date(recipient.createdAt).toLocaleDateString(),
        sortable: true,
        width: 120,
      },
      {
        id: 'actions',
        header: t('recipientsPage.columns.actions'),
        cell: () => null,
        hideable: false,
        width: 1,
      },
    ]

    return baseColumns.map((column) =>
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
                    aria-label={t('recipientsPage.actions.edit')}
                    variant="ghost"
                    color="warning"
                    size="sm"
                    title={t('recipientsPage.actions.edit')}
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
                        aria-label={t('recipientsPage.actions.delete')}
                        variant="ghost"
                        color="error"
                        size="sm"
                        title={t('recipientsPage.actions.delete')}
                        disabled={isDeleting}
                      >
                        <Trash2 size={14} />
                      </IconButton>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogTitle>{t('recipientsPage.deleteTitle')}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t('recipientsPage.deleteDescription')}
                      </AlertDialogDescription>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(recipient.id)}>
                          {t('recipientsPage.actions.delete')}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )
            },
          }
        : column,
    )
  }, [deleteRecipientMutation, t, toast, typeFilterOptions])

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
        error={error ? t('recipientsPage.failedToLoad') : null}
        emptyMessage={t('recipientsPage.empty')}
        priorityFilterIds={['name', 'type']}
        onResetState={resetTableState}
        title={t('recipientsPage.title')}
        description={t('recipientsPage.description')}
        tableActions={
          <Button
            color="teal"
            onClick={() => {
              setEditingRecipientId(null)
              setIsModalOpen(true)
            }}
          >
            {t('recipientsPage.addRecipient')}
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
