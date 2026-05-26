import type { ReactNode } from 'react'

interface DataTableToolbarProps {
  left?: ReactNode
  right?: ReactNode
  className?: string
}

export function DataTableToolbar({ left, right, className }: DataTableToolbarProps) {
  return (
    <div
      className={[
        'flex flex-wrap items-center justify-between gap-3',
        className,
      ].filter(Boolean).join(' ')}
    >
      <div className="flex flex-wrap items-center gap-2">{left}</div>
      <div className="flex flex-wrap items-center gap-2">{right}</div>
    </div>
  )
}
