import type { KeyboardEvent } from 'react'
import type { ColumnRenderInfo } from '../types'
import { TableCell } from './TableCell'

interface TableRowProps {
  row: unknown
  columns: ColumnRenderInfo[]
  onRowClick?: (row: unknown) => void
}

export function TableRow({ row, columns, onRowClick }: TableRowProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLTableRowElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onRowClick?.(row)
    }
  }

  return (
    <tr
      className={[
        'transition-colors hover:bg-neutral-50',
        onRowClick && 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-green-500',
      ].filter(Boolean).join(' ')}
      onClick={onRowClick ? () => onRowClick(row) : undefined}
      tabIndex={onRowClick ? 0 : undefined}
      onKeyDown={onRowClick ? handleKeyDown : undefined}
    >
      {columns.map(col => (
        <TableCell key={col.id} column={col} row={row} />
      ))}
    </tr>
  )
}
