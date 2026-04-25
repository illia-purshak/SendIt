import type { UiColor } from '../ui.config'

export const sliderColors: Record<UiColor, { range: string; thumb: string; focus: string }> = {
  green:   { range: 'bg-green-700',   thumb: 'border-green-700',   focus: 'focus-visible:ring-green-700' },
  neutral: { range: 'bg-neutral-900', thumb: 'border-neutral-900', focus: 'focus-visible:ring-neutral-600' },
  info:    { range: 'bg-info-600',    thumb: 'border-info-600',    focus: 'focus-visible:ring-info-600' },
  warning: { range: 'bg-warning-500', thumb: 'border-warning-500', focus: 'focus-visible:ring-warning-500' },
  error:   { range: 'bg-error-600',   thumb: 'border-error-600',   focus: 'focus-visible:ring-error-600' },
  success: { range: 'bg-success-600', thumb: 'border-success-600', focus: 'focus-visible:ring-success-600' },
}
