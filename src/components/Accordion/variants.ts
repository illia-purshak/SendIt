import type { UiColor } from '../ui.config'

export type AccordionVariant = 'default' | 'outline' | 'ghost'

export const accordionItemVariants: Record<AccordionVariant, string> = {
  default: 'border-b border-neutral-200 last:border-b-0',
  outline: 'border border-neutral-200 rounded-lg overflow-hidden mb-2 last:mb-0',
  ghost:   '',
}

export const accordionTriggerVariants: Record<AccordionVariant, string> = {
  default: 'py-4',
  outline: 'px-4 py-4',
  ghost:   'py-3',
}

export const accordionContentVariants: Record<AccordionVariant, string> = {
  default: 'pb-4',
  outline: 'px-4 pb-4',
  ghost:   'pb-3',
}

export const accordionTriggerColors: Record<UiColor, string> = {
  teal:    'hover:text-teal-700    data-[state=open]:text-teal-700',
  neutral: 'hover:text-neutral-600 data-[state=open]:text-neutral-900',
  info:    'hover:text-info-600    data-[state=open]:text-info-600',
  warning: 'hover:text-warning-500 data-[state=open]:text-warning-500',
  error:   'hover:text-error-600   data-[state=open]:text-error-600',
  success: 'hover:text-success-600 data-[state=open]:text-success-600',
}
