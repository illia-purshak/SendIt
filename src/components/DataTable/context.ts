import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'
import type { ColumnRenderInfo, FilterState, SortState } from './types'

export interface DataTableContextValue {
  visibleColumns: ColumnRenderInfo[]
  sortState: SortState | null
  handleSort: (columnId: string) => void
  filterState: FilterState
  setFilter: (columnId: string, value: string) => void
  clearFilter: (columnId: string) => void
  clearAllFilters: () => void
  onRowClick?: (row: unknown) => void
  isLoading: boolean
  error: string | null
  emptyMessage: ReactNode
  data: unknown[]
  getRowKey: (row: unknown) => string | number
  pageSize: number
}

export const DataTableCtx = createContext<DataTableContextValue | null>(null)

export function useDataTableCtx(): DataTableContextValue {
  const ctx = useContext(DataTableCtx)
  if (!ctx) throw new Error('useDataTableCtx must be used inside DataTable')
  return ctx
}
