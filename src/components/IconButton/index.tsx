import { Slot } from '@radix-ui/react-slot'
import { type ButtonHTMLAttributes } from 'react'
import { getButtonClasses, buttonFocusRing, type ButtonVariant } from '../Button/variants'
import { iconButtonSizes, type IconButtonSize } from './variants'
import { defaultUiColor, type UiColor } from '../ui.config'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  'aria-label': string
  variant?: ButtonVariant
  size?: IconButtonSize
  color?: UiColor
  asChild?: boolean
}

export function IconButton({
  variant = 'default',
  size = 'md',
  color = defaultUiColor,
  asChild,
  className,
  ...props
}: IconButtonProps) {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp
      className={[
        'inline-flex cursor-pointer items-center justify-center rounded-md transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        buttonFocusRing[color],
        'disabled:pointer-events-none disabled:opacity-50',
        getButtonClasses(variant, color),
        iconButtonSizes[size],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    />
  )
}
