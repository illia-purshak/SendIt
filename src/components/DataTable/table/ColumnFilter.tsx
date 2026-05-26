import { useDataTableCtx } from '../context'
import type { ColumnRenderInfo } from '../types'

interface ColumnFilterProps {
  column: ColumnRenderInfo
}

const inputClasses = [
  'h-8 w-full rounded border border-neutral-200 bg-white px-2 text-xs text-neutral-700',
  'placeholder:text-neutral-300',
  'focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-0',
  'transition-colors',
].join(' ')

export function ColumnFilter({ column }: ColumnFilterProps) {
  const { filterState, setFilter } = useDataTableCtx()
  const value = filterState[column.id] ?? ''
  const ariaLabel = typeof column.header === 'string' ? `Filter ${column.header}` : `Filter ${column.id}`

  if (column.filterType === 'select') {
    return (
      <select
        value={value}
        onChange={e => setFilter(column.id, e.target.value)}
        className={inputClasses}
        aria-label={ariaLabel}
      >
        <option value="">All</option>
        {column.filterOptions.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    )
  }

  return (
    <input
      type="text"
      value={value}
      onChange={e => setFilter(column.id, e.target.value)}
      placeholder="Filter…"
      className={inputClasses}
      aria-label={ariaLabel}
    />
  )
}
