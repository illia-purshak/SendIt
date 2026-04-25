import type { UiColor } from '../ui.config'

export const alertActionColors: Record<UiColor, string> = {
  green:   'bg-green-700 text-white hover:bg-green-500 focus-visible:ring-green-700',
  neutral: 'bg-neutral-900 text-neutral-50 hover:bg-neutral-600 focus-visible:ring-neutral-600',
  info:    'bg-info-600 text-white hover:bg-info-900 focus-visible:ring-info-600',
  warning: 'bg-warning-500 text-white hover:bg-warning-900 focus-visible:ring-warning-500',
  error:   'bg-error-600 text-white hover:bg-error-900 focus-visible:ring-error-600',
  success: 'bg-success-600 text-white hover:bg-success-900 focus-visible:ring-success-600',
}
