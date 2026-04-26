import { createContext } from 'react'

interface ToastItem {
  id: string
  title: string
  description?: string
  color?: import('../ui.config').UiColor
  action?: { label: string; onClick: () => void }
}

export type ToastOptions = Omit<ToastItem, 'id'>

export interface ToastContextValue {
  toast: (options: ToastOptions) => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)
