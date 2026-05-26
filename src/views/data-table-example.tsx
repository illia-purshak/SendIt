import { useNavigate } from 'react-router-dom'
import { Download, Plus } from 'lucide-react'
import { DataTable } from '@/components/DataTable/DataTable'
import { useDataTableUrlState } from '@/components/DataTable/hooks/useDataTableUrlState'
import type { ColumnDef } from '@/components/DataTable/types'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'

// ─── Types ───────────────────────────────────────────────────────────────────

type UserStatus = 'active' | 'inactive' | 'pending'

interface User {
  id: number
  name: string
  email: string
  role: string
  status: UserStatus
  plan: string
  createdAt: string
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const USERS: User[] = Array.from({ length: 87 }, (_, i) => ({
  id: i + 1,
  name: `User ${i + 1}`,
  email: `user${i + 1}@example.com`,
  role: i % 3 === 0 ? 'Admin' : i % 3 === 1 ? 'Manager' : 'Member',
  status: (['active', 'inactive', 'pending'] as UserStatus[])[i % 3],
  plan: i % 4 === 0 ? 'Enterprise' : i % 4 === 1 ? 'Pro' : i % 4 === 2 ? 'Starter' : 'Free',
  createdAt: new Date(Date.now() - i * 86_400_000).toLocaleDateString(),
}))

const STATUS_BADGE: Record<UserStatus, 'success' | 'destructive' | 'warning'> = {
  active: 'success',
  inactive: 'destructive',
  pending: 'warning',
}

const PAGE_SIZE = 10

// ─── Column definitions ────────────────────────────────────────────────────

const COLUMNS: ColumnDef<User>[] = [
  {
    id: 'id',
    header: 'ID',
    cell: row => <span className="font-mono text-xs text-neutral-400">#{row.id}</span>,
    sortable: true,
    width: 72,
    minWidth: 72,
    hideable: false,
  },
  {
    id: 'name',
    header: 'Name',
    cell: row => <span className="font-medium text-neutral-900">{row.name}</span>,
    sortable: true,
    filterable: true,
    minWidth: 140,
  },
  {
    id: 'email',
    header: 'Email',
    cell: row => <span className="text-neutral-600">{row.email}</span>,
    filterable: true,
    minWidth: 200,
  },
  {
    id: 'role',
    header: 'Role',
    cell: row => row.role,
    sortable: true,
    filterable: true,
    filterType: 'select',
    filterOptions: [
      { label: 'Admin', value: 'Admin' },
      { label: 'Manager', value: 'Manager' },
      { label: 'Member', value: 'Member' },
    ],
    width: 120,
    minWidth: 100,
  },
  {
    id: 'status',
    header: 'Status',
    cell: row => (
      <Badge variant={STATUS_BADGE[row.status]}>
        {row.status}
      </Badge>
    ),
    filterable: true,
    filterType: 'select',
    filterOptions: [
      { label: 'Active', value: 'active' },
      { label: 'Inactive', value: 'inactive' },
      { label: 'Pending', value: 'pending' },
    ],
    width: 110,
    minWidth: 90,
  },
  {
    id: 'plan',
    header: 'Plan',
    cell: row => row.plan,
    sortable: true,
    filterable: true,
    filterType: 'select',
    filterOptions: [
      { label: 'Enterprise', value: 'Enterprise' },
      { label: 'Pro', value: 'Pro' },
      { label: 'Starter', value: 'Starter' },
      { label: 'Free', value: 'Free' },
    ],
    width: 120,
    minWidth: 100,
  },
  {
    id: 'createdAt',
    header: 'Created',
    cell: row => <span className="text-neutral-500">{row.createdAt}</span>,
    sortable: true,
    width: 120,
    minWidth: 100,
  },
]

// ─── Client-side filter + sort helper (simulates server response) ─────────────

function applyFiltersAndSort(
  users: User[],
  filterState: Record<string, string>,
  sortColumnId: string | undefined,
  sortDirection: 'asc' | 'desc' | undefined,
): User[] {
  let result = users

  if (filterState.name) {
    result = result.filter(u => u.name.toLowerCase().includes(filterState.name.toLowerCase()))
  }
  if (filterState.email) {
    result = result.filter(u => u.email.toLowerCase().includes(filterState.email.toLowerCase()))
  }
  if (filterState.role) result = result.filter(u => u.role === filterState.role)
  if (filterState.status) result = result.filter(u => u.status === filterState.status)
  if (filterState.plan) result = result.filter(u => u.plan === filterState.plan)

  if (sortColumnId && sortDirection) {
    result = [...result].sort((a, b) => {
      const av = String(a[sortColumnId as keyof User])
      const bv = String(b[sortColumnId as keyof User])
      return sortDirection === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    })
  }

  return result
}

// ─── View ─────────────────────────────────────────────────────────────────────

export function DataTableExamplePage() {
  const navigate = useNavigate()
  const { urlState, setSortState, setFilterState, setPage, setColumnVisibility } =
    useDataTableUrlState()

  const filtered = applyFiltersAndSort(
    USERS,
    urlState.filterState,
    urlState.sortState?.columnId,
    urlState.sortState?.direction,
  )

  const totalRows = filtered.length
  const pageData = filtered.slice(
    (urlState.page - 1) * PAGE_SIZE,
    urlState.page * PAGE_SIZE,
  )

  const handleRowClick = (row: User) => {
    navigate(`/users/${row.id}`)
  }

  const handleExport = () => {
    const csv = [
      COLUMNS.map(c => c.id).join(','),
      ...filtered.map(u => COLUMNS.map(c => String(u[c.id as keyof User])).join(',')),
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'users.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-neutral-900">Users</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Manage your organization members. Sort, filter, and paginate — state persists in the URL.
        </p>
      </div>

      <DataTable
        columns={COLUMNS}
        data={pageData}
        getRowKey={row => row.id}
        page={urlState.page}
        pageSize={PAGE_SIZE}
        totalRows={totalRows}
        onPageChange={setPage}
        sortState={urlState.sortState}
        onSortChange={setSortState}
        filterState={urlState.filterState}
        onFilterChange={setFilterState}
        columnVisibility={urlState.columnVisibility}
        onColumnVisibilityChange={setColumnVisibility}
        onRowClick={handleRowClick}
        emptyMessage="No users match your filters."
        title="Users"
        description="Manage your organization members. Sort, filter, and paginate while state persists in the URL."
        tableActions={
          <>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download size={15} className="mr-1.5" />
              Export CSV
            </Button>
            <Button size="sm" onClick={() => navigate('/users/new')}>
              <Plus size={15} className="mr-1.5" />
              New user
            </Button>
          </>
        }
      />
    </div>
  )
}
