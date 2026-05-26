import type { UiColor } from '../ui.config'

export type ButtonColor = UiColor | 'brown' | 'pink' | 'gray'
export type ButtonVariant = 'default' | 'outline' | 'ghost'
export type ButtonSize = 'sm' | 'md' | 'lg'

export const buttonSizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
}

export const buttonFocusRing: Record<ButtonColor, string> = {
  green:   'focus-visible:ring-green-700',
  neutral: 'focus-visible:ring-neutral-600',
  info:    'focus-visible:ring-info-600',
  warning: 'focus-visible:ring-warning-500',
  error:   'focus-visible:ring-error-600',
  success: 'focus-visible:ring-success-600',
  brown:   'focus-visible:ring-brown-300',
  pink:    'focus-visible:ring-pink-300',
  gray:    'focus-visible:ring-neutral-400',
}

type ColorDef = Record<ButtonVariant, string>

const colorDefs: Record<ButtonColor, ColorDef> = {
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
  brown: {
    default: 'bg-brown-300 text-white hover:bg-brown-100 active:bg-brown-300',
    outline: 'border border-brown-300 text-brown-300 hover:bg-brown-100 active:bg-brown-100',
    ghost:   'text-brown-300 hover:bg-brown-100 active:bg-brown-100',
  },
  pink: {
    default: 'bg-pink-300 text-white hover:bg-pink-100 active:bg-pink-300',
    outline: 'border border-pink-300 text-pink-300 hover:bg-pink-100 active:bg-pink-100',
    ghost:   'text-pink-300 hover:bg-pink-100 active:bg-pink-100',
  },
  gray: {
    default: 'bg-neutral-400 text-white hover:bg-neutral-100 active:bg-neutral-400',
    outline: 'border border-neutral-400 text-neutral-400 hover:bg-neutral-100 active:bg-neutral-100',
    ghost:   'text-neutral-400 hover:bg-neutral-100 active:bg-neutral-100',
  },
}

export function getButtonClasses(variant: ButtonVariant, color: ButtonColor): string {
  return colorDefs[color][variant]
}
