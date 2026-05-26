import { useState } from 'react'
import type { ColumnDef, ColumnVisibilityState } from '../types'

interface UseDataTableColumnVisibilityOptions<TRow> {
  columns: ColumnDef<TRow>[]
  value?: ColumnVisibilityState
  onChange?: (v: ColumnVisibilityState) => void
}

export function useDataTableColumnVisibility<TRow>({
  columns,
  value,
  onChange,
}: UseDataTableColumnVisibilityOptions<TRow>) {
  const [internal, setInternal] = useState<ColumnVisibilityState>({})

  const columnVisibility: ColumnVisibilityState = value ?? internal
  const isControlled = value !== undefined

  const isVisible = (columnId: string) => columnVisibility[columnId] !== false

  const visibleColumns = columns.filter(col => isVisible(col.id))

  const toggleColumn = (columnId: string) => {
    const next = { ...columnVisibility, [columnId]: !isVisible(columnId) }
    if (!isControlled) setInternal(next)
    onChange?.(next)
  }

  const setColumnVisibility = (next: ColumnVisibilityState) => {
    if (!isControlled) setInternal(next)
    onChange?.(next)
  }

  return { columnVisibility, visibleColumns, toggleColumn, isVisible, setColumnVisibility }
}
