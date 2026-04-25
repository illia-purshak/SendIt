import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import { ChevronDown } from 'lucide-react'
import { createContext, useContext, type ComponentPropsWithoutRef } from 'react'
import {
  dropdownItemHighlight,
  dropdownTriggerFocusRing,
  getDropdownTriggerClasses,
  type DropdownVariant,
} from './variants'
import { defaultUiColor, type UiColor } from '../ui.config'

const DropdownCtx = createContext<{ color: UiColor }>({ color: defaultUiColor })

// ─── Dropdown (Root) ──────────────────────────────────────────────────────────

type DropdownProps = ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Root> & {
  color?: UiColor
}

export function Dropdown({ color = defaultUiColor, ...props }: DropdownProps) {
  return (
    <DropdownCtx.Provider value={{ color }}>
      <DropdownMenuPrimitive.Root {...props} />
    </DropdownCtx.Provider>
  )
}

// ─── DropdownTrigger ──────────────────────────────────────────────────────────

type DropdownTriggerProps = ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Trigger> & {
  variant?: DropdownVariant
}

export function DropdownTrigger({
  variant = 'outline',
  className,
  children,
  ...props
}: DropdownTriggerProps) {
  const { color } = useContext(DropdownCtx)
  return (
    <DropdownMenuPrimitive.Trigger
      className={[
        'inline-flex h-10 cursor-pointer items-center justify-between gap-2 rounded-md px-4 text-sm font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        dropdownTriggerFocusRing[color],
        getDropdownTriggerClasses(variant, color),
        className,
      ].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
      <ChevronDown size={14} className="shrink-0 opacity-60 transition-transform duration-200 [[data-state=open]_&]:rotate-180" />
    </DropdownMenuPrimitive.Trigger>
  )
}

// ─── DropdownContent ──────────────────────────────────────────────────────────

export function DropdownContent({
  className,
  sideOffset = 4,
  ...props
}: ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        sideOffset={sideOffset}
        className={[
          'z-50 min-w-[10rem] overflow-hidden rounded-lg border border-neutral-200 bg-white p-1 shadow-md',
          'data-[state=open]:animate-[dropdown-in_150ms_ease-out]',
          'data-[state=closed]:animate-[dropdown-out_100ms_ease-in]',
          className,
        ].filter(Boolean).join(' ')}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  )
}

// ─── DropdownItem ─────────────────────────────────────────────────────────────

export function DropdownItem({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item>) {
  const { color } = useContext(DropdownCtx)
  return (
    <DropdownMenuPrimitive.Item
      className={[
        'relative flex cursor-pointer select-none items-center gap-2 rounded-md px-3 py-2 text-sm text-neutral-700 outline-none',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-40',
        dropdownItemHighlight[color],
        className,
      ].filter(Boolean).join(' ')}
      {...props}
    />
  )
}

// ─── DropdownSeparator ────────────────────────────────────────────────────────

export function DropdownSeparator({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>) {
  return (
    <DropdownMenuPrimitive.Separator
      className={['-mx-1 my-1 h-px bg-neutral-100', className].filter(Boolean).join(' ')}
      {...props}
    />
  )
}

// ─── DropdownLabel ────────────────────────────────────────────────────────────

export function DropdownLabel({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label>) {
  return (
    <DropdownMenuPrimitive.Label
      className={[
        'px-3 py-1.5 text-xs font-medium uppercase tracking-widest text-neutral-400',
        className,
      ].filter(Boolean).join(' ')}
      {...props}
    />
  )
}
