import type { UiColor } from '../ui.config'

export type DropdownVariant = 'default' | 'outline' | 'ghost'

type TriggerColorDef = Record<DropdownVariant, string>

const triggerColorDefs: Record<UiColor, TriggerColorDef> = {
  green: {
    default: 'bg-green-700 text-white hover:bg-green-500 active:bg-green-950',
    outline: 'border border-green-700 text-green-700 hover:bg-green-100 active:bg-green-200',
    ghost:   'text-green-700 hover:bg-green-100 active:bg-green-200',
  },
  neutral: {
    default: 'bg-neutral-900 text-neutral-50 hover:bg-neutral-600',
    outline: 'border border-neutral-300 text-neutral-900 hover:bg-neutral-100 active:bg-neutral-100',
    ghost:   'text-neutral-600 hover:bg-neutral-100 active:bg-neutral-100',
  },
  info: {
    default: 'bg-info-600 text-white hover:bg-info-900',
    outline: 'border border-info-600 text-info-600 hover:bg-info-100 active:bg-info-100',
    ghost:   'text-info-600 hover:bg-info-100 active:bg-info-100',
  },
  warning: {
    default: 'bg-warning-500 text-white hover:bg-warning-900',
    outline: 'border border-warning-500 text-warning-500 hover:bg-warning-100 active:bg-warning-100',
    ghost:   'text-warning-500 hover:bg-warning-100 active:bg-warning-100',
  },
  error: {
    default: 'bg-error-600 text-white hover:bg-error-900',
    outline: 'border border-error-600 text-error-600 hover:bg-error-100 active:bg-error-100',
    ghost:   'text-error-600 hover:bg-error-100 active:bg-error-100',
  },
  success: {
    default: 'bg-success-600 text-white hover:bg-success-900',
    outline: 'border border-success-600 text-success-600 hover:bg-success-100 active:bg-success-100',
    ghost:   'text-success-600 hover:bg-success-100 active:bg-success-100',
  },
}

export const dropdownTriggerFocusRing: Record<UiColor, string> = {
  green:   'focus-visible:ring-green-700',
  neutral: 'focus-visible:ring-neutral-600',
  info:    'focus-visible:ring-info-600',
  warning: 'focus-visible:ring-warning-500',
  error:   'focus-visible:ring-error-600',
  success: 'focus-visible:ring-success-600',
}

export function getDropdownTriggerClasses(variant: DropdownVariant, color: UiColor): string {
  return triggerColorDefs[color][variant]
}

export const dropdownItemHighlight: Record<UiColor, string> = {
  green:   'data-[highlighted]:bg-green-100   data-[highlighted]:text-green-900',
  neutral: 'data-[highlighted]:bg-neutral-100 data-[highlighted]:text-neutral-900',
  info:    'data-[highlighted]:bg-info-100    data-[highlighted]:text-info-900',
  warning: 'data-[highlighted]:bg-warning-100 data-[highlighted]:text-warning-900',
  error:   'data-[highlighted]:bg-error-100   data-[highlighted]:text-error-900',
  success: 'data-[highlighted]:bg-success-100 data-[highlighted]:text-success-900',
}
