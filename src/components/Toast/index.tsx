import * as RadixToast from '@radix-ui/react-toast'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { UiColor } from '../ui.config'
import { toastStore } from '@/store/toastStore'

interface ToastItem {
  id: string
  title: string
  description?: string
  color?: UiColor
  action?: { label: string; onClick: () => void }
}

export type ToastOptions = Omit<ToastItem, 'id'>

interface ToastContextValue {
  toast: (options: ToastOptions) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const colorBar: Record<UiColor, string> = {
  green:   'bg-green-700',
  neutral: 'bg-neutral-900',
  info:    'bg-info-600',
  warning: 'bg-warning-500',
  error:   'bg-error-600',
  success: 'bg-success-600',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  function toast(options: ToastOptions) {
    const id = Math.random().toString(36).slice(2, 9)
    setToasts(prev => [...prev, { id, ...options }])
  }

  useEffect(() => {
    toastStore.register(toast)
  }, [])

  function dismiss(id: string) {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      <RadixToast.Provider swipeDirection="right" duration={4000}>
        {children}

        {toasts.map(t => (
          <RadixToast.Root
            key={t.id}
            defaultOpen
            onOpenChange={open => { if (!open) dismiss(t.id) }}
            className={[
              'relative flex w-80 items-start gap-3 overflow-hidden rounded-lg bg-white p-4 pr-8 shadow-lg',
              'data-[state=open]:animate-[toast-in_220ms_ease-out]',
              'data-[state=closed]:animate-[toast-out_180ms_ease-in]',
              'data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]',
              'data-[swipe=end]:animate-[toast-out_180ms_ease-in]',
            ].join(' ')}
          >
            <div className={`absolute left-0 top-0 h-full w-1 ${colorBar[t.color ?? 'neutral']}`} />

            <div className="ml-1 flex-1 min-w-0">
              <RadixToast.Title className="text-sm font-semibold text-neutral-900 leading-snug">
                {t.title}
              </RadixToast.Title>
              {t.description && (
                <RadixToast.Description className="mt-0.5 text-sm text-neutral-600">
                  {t.description}
                </RadixToast.Description>
              )}
              {t.action && (
                <RadixToast.Action altText={t.action.label} asChild>
                  <button
                    onClick={t.action.onClick}
                    className="mt-2 text-xs font-semibold text-neutral-900 underline underline-offset-2 hover:text-neutral-600"
                  >
                    {t.action.label}
                  </button>
                </RadixToast.Action>
              )}
            </div>

            <RadixToast.Close className="absolute right-2 top-2 rounded p-1 text-neutral-400 transition-colors hover:text-neutral-700">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </RadixToast.Close>
          </RadixToast.Root>
        ))}

        <RadixToast.Viewport className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 outline-none" />
      </RadixToast.Provider>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
