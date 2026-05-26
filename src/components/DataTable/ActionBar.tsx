import type { ReactNode } from 'react'

interface ActionBarProps {
  children?: ReactNode
  className?: string
}

export function ActionBar({ children, className }: ActionBarProps) {
  if (!children) return null

  return (
    <div
      className={[
        'flex flex-wrap items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-2.5',
        className,
      ].filter(Boolean).join(' ')}
    >
      {children}
    </div>
  )
}
