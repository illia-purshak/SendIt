import { useState } from 'react'
import type { FilterState } from '../types'

interface UseDataTableFiltersOptions {
  value?: FilterState
  onChange?: (filters: FilterState) => void
}

export function useDataTableFilters(options: UseDataTableFiltersOptions = {}) {
  const { value, onChange } = options
  const [internalFilters, setInternalFilters] = useState<FilterState>({})

  const filterState: FilterState = value ?? internalFilters
  const isControlled = value !== undefined

  const setFilter = (columnId: string, filterValue: string) => {
    const next = { ...filterState }
    if (filterValue) {
      next[columnId] = filterValue
    } else {
      delete next[columnId]
    }
    if (!isControlled) setInternalFilters(next)
    onChange?.(next)
  }

  const clearFilter = (columnId: string) => {
    const next = { ...filterState }
    delete next[columnId]
    if (!isControlled) setInternalFilters(next)
    onChange?.(next)
  }

  const clearAllFilters = () => {
    if (!isControlled) setInternalFilters({})
    onChange?.({})
  }

  return { filterState, setFilter, clearFilter, clearAllFilters }
}
