import { useSearchParams } from 'react-router-dom'
import type { ColumnVisibilityState, FilterState, SortState } from '../types'

export interface DataTableUrlState {
  sortState: SortState | null
  filterState: FilterState
  page: number
  columnVisibility: ColumnVisibilityState
}

interface UseDataTableUrlStateOptions {
  initialState?: Partial<DataTableUrlState>
}

const SORT_KEY = 'sort'
const PAGE_KEY = 'page'
const COLS_KEY = 'cols'
const FILTER_PREFIX = 'f_'

function parseSortParam(value: string | null): SortState | null {
  if (!value) return null
  const sep = value.lastIndexOf(':')
  if (sep === -1) return null
  const columnId = value.slice(0, sep)
  const direction = value.slice(sep + 1)
  if (!columnId || (direction !== 'asc' && direction !== 'desc')) return null
  return { columnId, direction }
}

function serializeSortParam(sort: SortState | null): string | null {
  return sort ? `${sort.columnId}:${sort.direction}` : null
}

function parseFilterState(params: URLSearchParams): FilterState {
  const filters: FilterState = {}
  params.forEach((v, key) => {
    if (key.startsWith(FILTER_PREFIX) && v) {
      filters[key.slice(FILTER_PREFIX.length)] = v
    }
  })
  return filters
}

function parseColsParam(value: string | null): ColumnVisibilityState {
  if (!value) return {}
  const visibility: ColumnVisibilityState = {}
  value.split(',').filter(Boolean).forEach(id => { visibility[id] = false })
  return visibility
}

function serializeColsParam(visibility: ColumnVisibilityState): string | null {
  const hidden = Object.entries(visibility)
    .filter(([, visible]) => !visible)
    .map(([id]) => id)
  return hidden.length > 0 ? hidden.join(',') : null
}

export function useDataTableUrlState(options: UseDataTableUrlStateOptions = {}) {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialState = options.initialState

  const urlState: DataTableUrlState = {
    sortState: parseSortParam(searchParams.get(SORT_KEY)) ?? initialState?.sortState ?? null,
    filterState: {
      ...(initialState?.filterState ?? {}),
      ...parseFilterState(searchParams),
    },
    page: Math.max(1, parseInt(searchParams.get(PAGE_KEY) ?? '1', 10) || 1),
    columnVisibility: {
      ...(initialState?.columnVisibility ?? {}),
      ...parseColsParam(searchParams.get(COLS_KEY)),
    },
  }

  if (!searchParams.get(PAGE_KEY) && initialState?.page && initialState.page > 1) {
    urlState.page = initialState.page
  }

  const setSortState = (sort: SortState | null) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      const serial = serializeSortParam(sort)
      if (serial) next.set(SORT_KEY, serial)
      else next.delete(SORT_KEY)
      next.delete(PAGE_KEY)
      return next
    }, { replace: true })
  }

  const setFilterState = (filters: FilterState) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      const toDelete: string[] = []
      next.forEach((_, key) => { if (key.startsWith(FILTER_PREFIX)) toDelete.push(key) })
      toDelete.forEach(key => next.delete(key))
      Object.entries(filters).forEach(([key, v]) => {
        if (v) next.set(`${FILTER_PREFIX}${key}`, v)
      })
      next.delete(PAGE_KEY)
      return next
    }, { replace: true })
  }

  const setPage = (page: number) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      if (page <= 1) next.delete(PAGE_KEY)
      else next.set(PAGE_KEY, String(page))
      return next
    }, { replace: true })
  }

  const setColumnVisibility = (visibility: ColumnVisibilityState) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      const serial = serializeColsParam(visibility)
      if (serial) next.set(COLS_KEY, serial)
      else next.delete(COLS_KEY)
      return next
    }, { replace: true })
  }

  const resetTableState = () => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      const toDelete: string[] = []

      next.forEach((_, key) => {
        if (key.startsWith(FILTER_PREFIX)) toDelete.push(key)
      })

      toDelete.forEach(key => next.delete(key))
      next.delete(SORT_KEY)
      next.delete(PAGE_KEY)

      return next
    }, { replace: true })
  }

  return { urlState, setSortState, setFilterState, setPage, setColumnVisibility, resetTableState }
}
