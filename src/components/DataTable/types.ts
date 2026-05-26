import type { ReactNode } from 'react'

export type SortDirection = 'asc' | 'desc'

export interface SortState {
  columnId: string
  direction: SortDirection
}

export type FilterState = Record<string, string>

export type ColumnVisibilityState = Record<string, boolean>

export interface SelectFilterOption {
  label: string
  value: string
}

export interface ColumnDef<TRow> {
  id: string
  header: ReactNode
  cell: (row: TRow) => ReactNode
  sortable?: boolean
  filterable?: boolean
  filterType?: 'text' | 'select'
  filterOptions?: SelectFilterOption[]
  width?: number | string
  minWidth?: number
  hideable?: boolean
}

// Normalized internal representation — no generics, all optionals resolved to required defaults.
// Created in DataTable.tsx via toRenderInfo(); consumed by context and all table sub-components.
export interface ColumnRenderInfo {
  id: string
  header: ReactNode
  renderCell: (row: unknown) => ReactNode
  sortable: boolean
  filterable: boolean
  filterType: 'text' | 'select'
  filterOptions: SelectFilterOption[]
  width: number | string | undefined
  minWidth: number | undefined
  hideable: boolean
}

export interface DataTableProps<TRow> {
  columns: ColumnDef<TRow>[]
  data: TRow[]
  getRowKey: (row: TRow) => string | number
  // Pagination — fully controlled; no page-size UI exposed
  page: number
  pageSize: number
  totalRows: number
  onPageChange: (page: number) => void
  // Sorting — controlled or uncontrolled
  sortState?: SortState | null
  onSortChange?: (sort: SortState | null) => void
  // Filters — controlled or uncontrolled
  filterState?: FilterState
  onFilterChange?: (filters: FilterState) => void
  // Column visibility — controlled or uncontrolled
  columnVisibility?: ColumnVisibilityState
  onColumnVisibilityChange?: (v: ColumnVisibilityState) => void
  // States
  isLoading?: boolean
  error?: string | null
  emptyMessage?: ReactNode
  // Interaction
  onRowClick?: (row: TRow) => void
  // Toolbar
  title?: string
  description?: string
  tableActions?: ReactNode
  priorityFilterIds?: string[]
  extraFilterContent?: ReactNode
  onResetState?: () => void
  className?: string
}
