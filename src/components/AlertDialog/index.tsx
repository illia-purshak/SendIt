import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog'
import { createContext, useContext, type ComponentPropsWithoutRef, type ReactNode } from 'react'
import { alertActionColors } from './variants'
import { defaultUiColor, type UiColor } from '../ui.config'

const AlertDialogCtx = createContext<{ color: UiColor }>({ color: defaultUiColor })

// ─── Root ─────────────────────────────────────────────────────────────────────

interface AlertDialogProps extends ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Root> {
  color?: UiColor
}

export function AlertDialog({ color = defaultUiColor, ...props }: AlertDialogProps) {
  return (
    <AlertDialogCtx.Provider value={{ color }}>
      <AlertDialogPrimitive.Root {...props} />
    </AlertDialogCtx.Provider>
  )
}

// ─── Trigger ──────────────────────────────────────────────────────────────────

export const AlertDialogTrigger = AlertDialogPrimitive.Trigger

// ─── Content (includes portal + overlay) ─────────────────────────────────────

export function AlertDialogContent({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>) {
  return (
    <AlertDialogPrimitive.Portal>
      <AlertDialogPrimitive.Overlay
        className={[
          'fixed inset-0 z-50 bg-black/50',
          'data-[state=open]:animate-[dialog-overlay-in_200ms_ease]',
          'data-[state=closed]:animate-[dialog-overlay-out_150ms_ease]',
        ].join(' ')}
      />
      <AlertDialogPrimitive.Content
        className={[
          'fixed left-1/2 top-1/2 z-50 w-full max-w-md rounded-xl bg-white p-6 shadow-xl',
          'data-[state=open]:animate-[dialog-in_200ms_ease]',
          'data-[state=closed]:animate-[dialog-out_150ms_ease]',
          className,
        ].filter(Boolean).join(' ')}
        {...props}
      >
        {children}
      </AlertDialogPrimitive.Content>
    </AlertDialogPrimitive.Portal>
  )
}

// ─── Title ────────────────────────────────────────────────────────────────────

export function AlertDialogTitle({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>) {
  return (
    <AlertDialogPrimitive.Title
      className={['text-base font-semibold text-neutral-900', className].filter(Boolean).join(' ')}
      {...props}
    />
  )
}

// ─── Description ─────────────────────────────────────────────────────────────

export function AlertDialogDescription({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>) {
  return (
    <AlertDialogPrimitive.Description
      className={['mt-2 text-sm text-neutral-600', className].filter(Boolean).join(' ')}
      {...props}
    />
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────

export function AlertDialogFooter({ children }: { children: ReactNode }) {
  return (
    <div className="mt-6 flex justify-end gap-3">{children}</div>
  )
}

// ─── Cancel ───────────────────────────────────────────────────────────────────

export function AlertDialogCancel({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel>) {
  return (
    <AlertDialogPrimitive.Cancel
      className={[
        'inline-flex h-10 items-center justify-center rounded-md border border-neutral-300',
        'px-4 text-sm font-medium text-neutral-700 transition-colors',
        'hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2',
        'focus-visible:ring-neutral-400 focus-visible:ring-offset-2',
        className,
      ].filter(Boolean).join(' ')}
      {...props}
    />
  )
}

// ─── Action ───────────────────────────────────────────────────────────────────

export function AlertDialogAction({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action>) {
  const { color } = useContext(AlertDialogCtx)
  return (
    <AlertDialogPrimitive.Action
      className={[
        'inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        alertActionColors[color],
        className,
      ].filter(Boolean).join(' ')}
      {...props}
    />
  )
}
