import * as TogglePrimitive from '@radix-ui/react-toggle'
import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group'
import { createContext, useContext, type ComponentPropsWithoutRef } from 'react'
import { getToggleClasses, toggleFocusRing, toggleSizes, type ToggleSize, type ToggleVariant } from './variants'
import { defaultUiColor, type UiColor } from '../ui.config'

// ─── Shared base classes ────────────────────────────────────────────────────

function baseClasses(variant: ToggleVariant, color: UiColor, size: ToggleSize, extra?: string) {
  return [
    'inline-flex cursor-pointer items-center justify-center rounded-md font-medium transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    toggleFocusRing[color],
    getToggleClasses(variant, color),
    toggleSizes[size],
    extra,
  ].filter(Boolean).join(' ')
}

// ─── Toggle ─────────────────────────────────────────────────────────────────

interface ToggleProps extends ComponentPropsWithoutRef<typeof TogglePrimitive.Root> {
  variant?: ToggleVariant
  size?: ToggleSize
  color?: UiColor
}

export function Toggle({
  variant = 'default',
  size = 'md',
  color = defaultUiColor,
  className,
  ...props
}: ToggleProps) {
  return (
    <TogglePrimitive.Root
      className={baseClasses(variant, color, size, className)}
      {...props}
    />
  )
}

// ─── ToggleGroup ─────────────────────────────────────────────────────────────

interface ToggleGroupCtxValue {
  color: UiColor
  variant: ToggleVariant
  size: ToggleSize
}

const ToggleGroupCtx = createContext<ToggleGroupCtxValue>({
  color: defaultUiColor,
  variant: 'default',
  size: 'md',
})

type ToggleGroupProps = ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root> & {
  color?: UiColor
  variant?: ToggleVariant
  size?: ToggleSize
}

export function ToggleGroup({
  color = defaultUiColor,
  variant = 'default',
  size = 'md',
  className,
  ...props
}: ToggleGroupProps) {
  return (
    <ToggleGroupCtx.Provider value={{ color, variant, size }}>
      <ToggleGroupPrimitive.Root
        className={['flex gap-1', className].filter(Boolean).join(' ')}
        {...props}
      />
    </ToggleGroupCtx.Provider>
  )
}

export function ToggleGroupItem({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item>) {
  const { color, variant, size } = useContext(ToggleGroupCtx)
  return (
    <ToggleGroupPrimitive.Item
      className={baseClasses(variant, color, size, className)}
      {...props}
    />
  )
}
