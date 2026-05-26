import type { ToastOptions } from '@/components/Toast/toast-context'

type ToastFn = (options: ToastOptions) => void

let _toast: ToastFn | null = null

export const toastStore = {
  register(fn: ToastFn) { _toast = fn },
  toast(options: ToastOptions) { _toast?.(options) },
}
