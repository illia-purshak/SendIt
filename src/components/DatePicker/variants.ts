import type { UiColor } from '../ui.config'

export type DatePickerVariant = 'default' | 'outline' | 'ghost'

const variantBase: Record<DatePickerVariant, string> = {
  default: 'bg-white border border-neutral-300 rounded-md',
  outline: 'bg-transparent border-2 rounded-md',
  ghost:   'bg-transparent border-b border-neutral-300 rounded-none',
}

const colorFocus: Record<UiColor, string> = {
  green:   'focus-visible:ring-green-700',
  neutral: 'focus-visible:ring-neutral-600',
  info:    'focus-visible:ring-info-600',
  warning: 'focus-visible:ring-warning-500',
  error:   'focus-visible:ring-error-600',
  success: 'focus-visible:ring-success-600',
}

const colorOutlineBorder: Record<UiColor, string> = {
  green:   'border-green-700',
  neutral: 'border-neutral-300',
  info:    'border-info-600',
  warning: 'border-warning-500',
  error:   'border-error-600',
  success: 'border-success-600',
}

export function getDatePickerTriggerClasses(variant: DatePickerVariant, color: UiColor): string {
  const outlineBorder = variant === 'outline' ? colorOutlineBorder[color] : ''
  return [variantBase[variant], outlineBorder, colorFocus[color]].filter(Boolean).join(' ')
}

export const calendarDayFocusRing: Record<UiColor, string> = {
  green:   'focus-visible:ring-green-700',
  neutral: 'focus-visible:ring-neutral-600',
  info:    'focus-visible:ring-info-600',
  warning: 'focus-visible:ring-warning-500',
  error:   'focus-visible:ring-error-600',
  success: 'focus-visible:ring-success-600',
}

export const calendarSelectedDay: Record<UiColor, string> = {
  green:   'bg-green-700 text-white hover:bg-green-500',
  neutral: 'bg-neutral-900 text-neutral-50 hover:bg-neutral-600',
  info:    'bg-info-600 text-white hover:bg-info-900',
  warning: 'bg-warning-500 text-white hover:bg-warning-900',
  error:   'bg-error-600 text-white hover:bg-error-900',
  success: 'bg-success-600 text-white hover:bg-success-900',
}

export const calendarTodayText: Record<UiColor, string> = {
  green:   'text-green-700',
  neutral: 'text-neutral-900',
  info:    'text-info-600',
  warning: 'text-warning-500',
  error:   'text-error-600',
  success: 'text-success-600',
}

export const calendarNavButton = [
  'inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md',
  'text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-900',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300',
  'disabled:pointer-events-none disabled:opacity-30',
].join(' ')
