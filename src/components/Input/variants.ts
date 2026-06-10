import type { UiColor } from '../ui.config'

export type InputVariant = 'default' | 'outline' | 'ghost'

const variantBase: Record<InputVariant, string> = {
  default: 'bg-white border border-neutral-300',
  outline: 'bg-transparent border',
  ghost:   'bg-transparent border-b border-neutral-300 rounded-none px-0',
}

const colorFocus: Record<UiColor, string> = {
  teal:    'focus:border-teal-600',
  neutral: 'focus:border-neutral-600',
  info:    'focus:border-info-600',
  warning: 'focus:border-warning-500',
  error:   'focus:border-error-600',
  success: 'focus:border-success-600',
}

const colorOutlineBorder: Record<UiColor, string> = {
  teal:    'border-teal-300',
  neutral: 'border-neutral-300',
  info:    'border-info-300',
  warning: 'border-warning-300',
  error:   'border-error-300',
  success: 'border-success-400',
}

const errorClasses = 'border-error-600 focus:border-error-600'

export function getInputClasses(variant: InputVariant, color: UiColor, hasError: boolean): string {
  const base = variantBase[variant]
  if (hasError) return [base, errorClasses].join(' ')
  const outlineBorder = variant === 'outline' ? colorOutlineBorder[color] : ''
  return [base, outlineBorder, colorFocus[color]].filter(Boolean).join(' ')
}
