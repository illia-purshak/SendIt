import type { UiColor } from '../ui.config'

export type ToggleVariant = 'default' | 'outline' | 'ghost'
export type ToggleSize = 'sm' | 'md' | 'lg'

export const toggleSizes: Record<ToggleSize, string> = {
  sm: 'h-7 px-3 text-sm',
  md: 'h-8 px-3 text-sm',
  lg: 'h-9 px-4 text-sm',
}

export const toggleFocusRing: Record<UiColor, string> = {
  teal:    'focus-visible:ring-teal-700',
  neutral: 'focus-visible:ring-neutral-600',
  info:    'focus-visible:ring-info-600',
  warning: 'focus-visible:ring-warning-500',
  error:   'focus-visible:ring-error-600',
  success: 'focus-visible:ring-success-600',
}

type VariantDef = Record<ToggleVariant, string>

const colorDefs: Record<UiColor, VariantDef> = {
  teal: {
    default: 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 data-[state=on]:bg-teal-700 data-[state=on]:text-white data-[state=on]:hover:bg-teal-800',
    outline: 'border border-neutral-300 text-neutral-700 hover:bg-neutral-50 data-[state=on]:border-teal-700 data-[state=on]:bg-teal-50 data-[state=on]:text-teal-700',
    ghost:   'text-neutral-700 hover:bg-neutral-100 data-[state=on]:bg-teal-50 data-[state=on]:text-teal-700',
  },
  neutral: {
    default: 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 data-[state=on]:bg-neutral-900 data-[state=on]:text-neutral-50',
    outline: 'border border-neutral-300 text-neutral-700 hover:bg-neutral-50 data-[state=on]:border-neutral-900 data-[state=on]:bg-neutral-100 data-[state=on]:text-neutral-900',
    ghost:   'text-neutral-700 hover:bg-neutral-100 data-[state=on]:bg-neutral-200 data-[state=on]:text-neutral-900',
  },
  info: {
    default: 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 data-[state=on]:bg-info-600 data-[state=on]:text-white',
    outline: 'border border-neutral-300 text-neutral-700 hover:bg-neutral-50 data-[state=on]:border-info-600 data-[state=on]:bg-info-100 data-[state=on]:text-info-600',
    ghost:   'text-neutral-700 hover:bg-neutral-100 data-[state=on]:bg-info-100 data-[state=on]:text-info-600',
  },
  warning: {
    default: 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 data-[state=on]:bg-warning-500 data-[state=on]:text-white',
    outline: 'border border-neutral-300 text-neutral-700 hover:bg-neutral-50 data-[state=on]:border-warning-500 data-[state=on]:bg-warning-100 data-[state=on]:text-warning-500',
    ghost:   'text-neutral-700 hover:bg-neutral-100 data-[state=on]:bg-warning-100 data-[state=on]:text-warning-500',
  },
  error: {
    default: 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 data-[state=on]:bg-error-600 data-[state=on]:text-white',
    outline: 'border border-neutral-300 text-neutral-700 hover:bg-neutral-50 data-[state=on]:border-error-600 data-[state=on]:bg-error-100 data-[state=on]:text-error-600',
    ghost:   'text-neutral-700 hover:bg-neutral-100 data-[state=on]:bg-error-100 data-[state=on]:text-error-600',
  },
  success: {
    default: 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 data-[state=on]:bg-success-600 data-[state=on]:text-white',
    outline: 'border border-neutral-300 text-neutral-700 hover:bg-neutral-50 data-[state=on]:border-success-600 data-[state=on]:bg-success-100 data-[state=on]:text-success-600',
    ghost:   'text-neutral-700 hover:bg-neutral-100 data-[state=on]:bg-success-100 data-[state=on]:text-success-600',
  },
}

export function getToggleClasses(variant: ToggleVariant, color: UiColor): string {
  return colorDefs[color][variant]
}
