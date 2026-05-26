import { useDataTableCtx } from '../context'
import { TableRow } from './TableRow'

export function TableBody() {
  const { visibleColumns, data, getRowKey, onRowClick, isLoading, error, emptyMessage, pageSize } =
    useDataTableCtx()

  const skeletonCount = Math.min(pageSize, 8)

  if (isLoading) {
    return (
      <tbody>
        {Array.from({ length: skeletonCount }, (_, i) => (
          <tr key={i} className="border-b border-neutral-100">
            {visibleColumns.map(col => (
              <td key={col.id} className="px-4 py-3">
                <div
                  className="h-4 animate-pulse rounded bg-neutral-200"
                  style={{ width: col.width ? '100%' : '75%' }}
                />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    )
  }

  if (error) {
    return (
      <tbody>
        <tr>
          <td
            colSpan={visibleColumns.length}
            className="px-4 py-12 text-center text-sm text-error-600"
          >
            {error}
          </td>
        </tr>
      </tbody>
    )
  }

  if (data.length === 0) {
    return (
      <tbody>
        <tr>
          <td
            colSpan={visibleColumns.length}
            className="px-4 py-12 text-center text-sm text-neutral-400"
          >
            {emptyMessage}
          </td>
        </tr>
      </tbody>
    )
  }

  return (
    <tbody>
      {data.map(row => (
        <TableRow
          key={getRowKey(row)}
          row={row}
          columns={visibleColumns}
          onRowClick={onRowClick}
        />
      ))}
    </tbody>
  )
}
