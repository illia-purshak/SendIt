import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import { Check, Columns3 } from 'lucide-react'
import type { ColumnDef, ColumnVisibilityState } from './types'

interface DataTableColumnVisibilityDropdownProps<TRow> {
  columns: ColumnDef<TRow>[]
  columnVisibility: ColumnVisibilityState
  onColumnVisibilityChange: (v: ColumnVisibilityState) => void
}

export function DataTableColumnVisibilityDropdown<TRow>({
  columns,
  columnVisibility,
  onColumnVisibilityChange,
}: DataTableColumnVisibilityDropdownProps<TRow>) {
  const hideableColumns = columns.filter(col => col.hideable !== false)

  const isVisible = (id: string) => columnVisibility[id] !== false

  const toggle = (id: string) =>
    onColumnVisibilityChange({ ...columnVisibility, [id]: !isVisible(id) })

  return (
    <DropdownMenuPrimitive.Root>
      <DropdownMenuPrimitive.Trigger
        className={[
          'inline-flex h-9 items-center gap-2 rounded-md border border-neutral-200 px-3 text-sm text-neutral-600',
          'hover:bg-neutral-50 hover:text-neutral-800',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-1',
          'data-[state=open]:bg-neutral-50',
          'transition-colors',
        ].join(' ')}
      >
        <Columns3 size={15} />
        Columns
      </DropdownMenuPrimitive.Trigger>

      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
          align="end"
          sideOffset={4}
          className={[
            'z-50 min-w-44 overflow-hidden rounded-lg border border-neutral-200 bg-white p-1 shadow-md',
            'data-[state=open]:animate-[dropdown-in_150ms_ease-out]',
            'data-[state=closed]:animate-[dropdown-out_100ms_ease-in]',
          ].join(' ')}
        >
          {hideableColumns.map(col => (
            <DropdownMenuPrimitive.CheckboxItem
              key={col.id}
              checked={isVisible(col.id)}
              onCheckedChange={() => toggle(col.id)}
              className={[
                'relative flex cursor-pointer select-none items-center gap-2 rounded-md px-3 py-2 text-sm text-neutral-700 outline-none',
                'data-[highlighted]:bg-neutral-100',
              ].join(' ')}
            >
              <span className="flex h-4 w-4 items-center justify-center">
                <DropdownMenuPrimitive.ItemIndicator>
                  <Check size={13} strokeWidth={2.5} />
                </DropdownMenuPrimitive.ItemIndicator>
              </span>
              {typeof col.header === 'string' ? col.header : col.id}
            </DropdownMenuPrimitive.CheckboxItem>
          ))}
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  )
}
