import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react'
import type { KeyboardEvent } from 'react'
import { useDataTableCtx } from '../context'

export function TableHeader() {
  const { visibleColumns, sortState, handleSort } = useDataTableCtx()

  return (
    <thead>
      <tr className="border-b border-neutral-200">
        {visibleColumns.map(col => {
          const isSorted = sortState?.columnId === col.id
          const direction = isSorted ? sortState.direction : null

          const handleKeyDown = (e: KeyboardEvent<HTMLTableCellElement>) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              handleSort(col.id)
            }
          }

          return (
            <th
              key={col.id}
              className={[
                'bg-neutral-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500',
                'overflow-hidden',
                col.sortable && [
                  'cursor-pointer select-none',
                  'hover:bg-neutral-100 hover:text-neutral-700',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-500',
                ].join(' '),
              ].filter(Boolean).join(' ')}
              style={{ width: col.width, minWidth: col.minWidth }}
              onClick={col.sortable ? () => handleSort(col.id) : undefined}
              onKeyDown={col.sortable ? handleKeyDown : undefined}
              tabIndex={col.sortable ? 0 : undefined}
              aria-sort={
                isSorted
                  ? direction === 'asc'
                    ? 'ascending'
                    : 'descending'
                  : col.sortable
                    ? 'none'
                    : undefined
              }
            >
              <span className="flex items-center gap-1.5 truncate">
                <span className="truncate">{col.header}</span>
                {col.sortable && (
                  <span className="shrink-0">
                    {direction === 'asc' ? (
                      <ChevronUp size={13} />
                    ) : direction === 'desc' ? (
                      <ChevronDown size={13} />
                    ) : (
                      <ChevronsUpDown size={13} className="text-neutral-300" />
                    )}
                  </span>
                )}
              </span>
            </th>
          )
        })}
      </tr>
    </thead>
  )
}
