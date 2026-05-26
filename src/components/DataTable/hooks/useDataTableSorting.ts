import { useState } from 'react'
import type { SortState } from '../types'

interface UseDataTableSortingOptions {
  value?: SortState | null
  onChange?: (sort: SortState | null) => void
}

export function useDataTableSorting(options: UseDataTableSortingOptions = {}) {
  const { value, onChange } = options
  const [internalSort, setInternalSort] = useState<SortState | null>(null)

  const isControlled = value !== undefined
  const sortState: SortState | null = isControlled ? value : internalSort

  const handleSort = (columnId: string) => {
    let next: SortState | null

    if (!sortState || sortState.columnId !== columnId) {
      next = { columnId, direction: 'asc' }
    } else if (sortState.direction === 'asc') {
      next = { columnId, direction: 'desc' }
    } else {
      next = null
    }

    if (!isControlled) setInternalSort(next)
    onChange?.(next)
  }

  const clearSort = () => {
    if (!isControlled) setInternalSort(null)
    onChange?.(null)
  }

  return { sortState, handleSort, clearSort }
}
