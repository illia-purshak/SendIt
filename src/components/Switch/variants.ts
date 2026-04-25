import type { UiColor } from '../ui.config'

export type SwitchSize = 'sm' | 'md' | 'lg'

export const switchSizes: Record<SwitchSize, { root: string; thumb: string }> = {
  sm: { root: 'h-5 w-9',  thumb: 'h-4 w-4 m-0.5 data-[state=checked]:translate-x-4' },
  md: { root: 'h-6 w-11', thumb: 'h-5 w-5 m-0.5 data-[state=checked]:translate-x-5' },
  lg: { root: 'h-7 w-14', thumb: 'h-6 w-6 m-0.5 data-[state=checked]:translate-x-7' },
}

export const switchColors: Record<UiColor, { on: string; focus: string }> = {
  green:   { on: 'data-[state=checked]:bg-green-700',   focus: 'focus-visible:ring-green-700' },
  neutral: { on: 'data-[state=checked]:bg-neutral-900', focus: 'focus-visible:ring-neutral-600' },
  info:    { on: 'data-[state=checked]:bg-info-600',    focus: 'focus-visible:ring-info-600' },
  warning: { on: 'data-[state=checked]:bg-warning-500', focus: 'focus-visible:ring-warning-500' },
  error:   { on: 'data-[state=checked]:bg-error-600',   focus: 'focus-visible:ring-error-600' },
  success: { on: 'data-[state=checked]:bg-success-600', focus: 'focus-visible:ring-success-600' },
}
