import type { ReactNode } from 'react'
import { useDataTableCtx } from './context'
import { ColumnFilter } from './table/ColumnFilter'
import type { ColumnRenderInfo } from './types'

interface DataTableFilterBarProps {
  priorityFilterIds?: string[]
  extraContent?: ReactNode
}

function renderFilterControl(col: ColumnRenderInfo) {
  return (
    <div key={col.id} className="flex min-w-36 flex-1 flex-col gap-1">
      <span className="text-xs font-medium text-neutral-500">
        {typeof col.header === 'string' ? col.header : col.id}
      </span>
      <ColumnFilter column={col} />
    </div>
  )
}

export function DataTableFilterBar({
  priorityFilterIds = [],
  extraContent,
}: DataTableFilterBarProps) {
  const { visibleColumns } = useDataTableCtx()
  const filterableCols = visibleColumns.filter(c => c.filterable)
  const priorityIds = new Set(priorityFilterIds)
  const prioritizedCols = priorityFilterIds
    .map(id => filterableCols.find(col => col.id === id))
    .filter((col): col is (typeof filterableCols)[number] => Boolean(col))
  const remainingCols = filterableCols.filter(col => !priorityIds.has(col.id))

  if (filterableCols.length === 0 && !extraContent) return null

  if (prioritizedCols.length === 0) {
    return (
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3">
        {filterableCols.map(renderFilterControl)}
        {extraContent}
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3">
      <div className="flex flex-wrap items-end gap-3">
        {prioritizedCols.map(renderFilterControl)}
      </div>
      {(remainingCols.length > 0 || extraContent) && (
        <div className="mt-3 flex flex-wrap items-end gap-3 border-t border-neutral-200 pt-3">
          {remainingCols.map(renderFilterControl)}
          {extraContent}
        </div>
      )}
    </div>
  )
}
