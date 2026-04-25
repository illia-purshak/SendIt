import type { UiColor } from '../ui.config'

export type CheckboxSize = 'sm' | 'md' | 'lg'

export const checkboxSizes: Record<CheckboxSize, { box: string; iconSize: number }> = {
  sm: { box: 'h-4 w-4 rounded',    iconSize: 10 },
  md: { box: 'h-5 w-5 rounded',    iconSize: 12 },
  lg: { box: 'h-6 w-6 rounded-md', iconSize: 14 },
}

export const checkboxColors: Record<UiColor, { checked: string; focus: string }> = {
  green:   { checked: 'data-[state=checked]:bg-green-700 data-[state=checked]:border-green-700',     focus: 'focus-visible:ring-green-700' },
  neutral: { checked: 'data-[state=checked]:bg-neutral-900 data-[state=checked]:border-neutral-900', focus: 'focus-visible:ring-neutral-600' },
  info:    { checked: 'data-[state=checked]:bg-info-600 data-[state=checked]:border-info-600',       focus: 'focus-visible:ring-info-600' },
  warning: { checked: 'data-[state=checked]:bg-warning-500 data-[state=checked]:border-warning-500', focus: 'focus-visible:ring-warning-500' },
  error:   { checked: 'data-[state=checked]:bg-error-600 data-[state=checked]:border-error-600',     focus: 'focus-visible:ring-error-600' },
  success: { checked: 'data-[state=checked]:bg-success-600 data-[state=checked]:border-success-600', focus: 'focus-visible:ring-success-600' },
}
