import type { HTMLAttributes } from 'react'

export type BadgeVariant = 'error' | 'warning' | 'info' | 'success' | 'pink' | 'brown' | 'destructive'
export type BadgeSize = 'sm' | 'md'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  size?: BadgeSize
}

const solidClasses: Record<BadgeVariant, string> = {
  error:       'bg-error-600 text-white',
  warning:     'bg-warning-500 text-white',
  info:        'bg-info-600 text-white',
  success:     'bg-success-600 text-white',
  pink:        'bg-pink-300 text-white',
  brown:       'bg-brown-300 text-white',
  destructive: 'bg-neutral-400 text-white',
}

const outlineClasses: Record<BadgeVariant, string> = {
  error:       'border border-error-600 text-error-600',
  warning:     'border border-warning-500 text-warning-500',
  info:        'border border-info-600 text-info-600',
  success:     'border border-success-600 text-success-600',
  pink:        'border border-pink-300 text-pink-300',
  brown:       'border border-brown-300 text-brown-300',
  destructive: 'border border-neutral-400 text-neutral-400',
}

export function Badge({ variant = 'error', size = 'sm', className, ...props }: BadgeProps) {
  const colorClass = size === 'sm' ? solidClasses[variant] : outlineClasses[variant]
  return (
    <span
      className={[
        'inline-flex items-center justify-center rounded px-1.5 py-1 text-xs leading-4 font-normal whitespace-nowrap',
        colorClass,
        className,
      ].filter(Boolean).join(' ')}
      {...props}
    />
  )
}
