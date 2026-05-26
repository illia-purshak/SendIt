import type { ColumnRenderInfo } from '../types'

interface TableCellProps {
  column: ColumnRenderInfo
  row: unknown
}

export function TableCell({ column, row }: TableCellProps) {
  return (
    <td
      className="overflow-hidden truncate border-b border-neutral-100 px-4 py-3 text-sm text-neutral-700"
      style={{ width: column.width, minWidth: column.minWidth }}
    >
      {column.renderCell(row)}
    </td>
  )
}
