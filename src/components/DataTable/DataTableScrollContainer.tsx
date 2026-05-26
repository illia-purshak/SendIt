import type { ReactNode } from 'react'

interface DataTableScrollContainerProps {
  children: ReactNode
  className?: string
}

export function DataTableScrollContainer({ children, className }: DataTableScrollContainerProps) {
  return (
    <div
      className={[
        'w-full overflow-x-auto rounded-lg border border-neutral-200',
        className,
      ].filter(Boolean).join(' ')}
    >
      {children}
    </div>
  )
}
