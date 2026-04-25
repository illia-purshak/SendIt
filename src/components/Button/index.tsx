import { Slot } from '@radix-ui/react-slot'
import { type ButtonHTMLAttributes } from 'react'
import { getButtonClasses, buttonSizes, buttonFocusRing, type ButtonVariant, type ButtonSize } from './variants'
import { defaultUiColor, type UiColor } from '../ui.config'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  color?: UiColor
  asChild?: boolean
}

export function Button({
  variant = 'default',
  size = 'md',
  color = defaultUiColor,
  asChild,
  className,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp
      className={[
        'inline-flex cursor-pointer items-center justify-center rounded-md font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        buttonFocusRing[color],
        'disabled:pointer-events-none disabled:opacity-50',
        getButtonClasses(variant, color),
        buttonSizes[size],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    />
  )
}
