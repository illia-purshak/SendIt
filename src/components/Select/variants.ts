import type { UiColor } from '../ui.config'

export type SelectVariant = 'default' | 'outline' | 'ghost'

const variantBase: Record<SelectVariant, string> = {
  default: 'bg-white border border-neutral-300',
  outline: 'bg-transparent border',
  ghost:   'bg-transparent border-b border-neutral-300 rounded-none',
}

const colorOpen: Record<UiColor, string> = {
  teal:    'data-[state=open]:border-teal-700',
  neutral: 'data-[state=open]:border-neutral-600',
  info:    'data-[state=open]:border-info-600',
  warning: 'data-[state=open]:border-warning-500',
  error:   'data-[state=open]:border-error-600',
  success: 'data-[state=open]:border-success-600',
}

const colorOutlineBorder: Record<UiColor, string> = {
  teal:    'border-teal-300',
  neutral: 'border-neutral-300',
  info:    'border-info-300',
  warning: 'border-warning-300',
  error:   'border-error-300',
  success: 'border-success-400',
}

const errorClasses = 'border-error-600 data-[state=open]:border-error-600'

export function getSelectTriggerClasses(variant: SelectVariant, color: UiColor, hasError: boolean): string {
  const base = variantBase[variant]
  if (hasError) return [base, errorClasses].join(' ')
  const outlineBorder = variant === 'outline' ? colorOutlineBorder[color] : ''
  return [base, outlineBorder, colorOpen[color]].filter(Boolean).join(' ')
}

export const selectItemHighlight: Record<UiColor, string> = {
  teal:    'data-[highlighted]:bg-teal-50    data-[highlighted]:text-teal-900',
  neutral: 'data-[highlighted]:bg-neutral-100 data-[highlighted]:text-neutral-900',
  info:    'data-[highlighted]:bg-info-100    data-[highlighted]:text-info-900',
  warning: 'data-[highlighted]:bg-warning-100 data-[highlighted]:text-warning-900',
  error:   'data-[highlighted]:bg-error-100   data-[highlighted]:text-error-900',
  success: 'data-[highlighted]:bg-success-100 data-[highlighted]:text-success-900',
}
