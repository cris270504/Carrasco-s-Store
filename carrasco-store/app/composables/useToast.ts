export interface ToastItem {
  id: number
  type: 'info' | 'success' | 'warning' | 'error'
  message: string
}

// Estado compartido leído por ToastStack.vue (montado una sola vez en app.vue).
export function useToastState() {
  return useState<ToastItem[]>('toast-stack', () => [])
}

export function useToast() {
  const toasts = useToastState()

  function dismiss(id: number) {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  function push(type: ToastItem['type'], message: string, duration = 4000) {
    const id = Date.now() + Math.random()
    toasts.value.push({ id, type, message })
    if (duration > 0) {
      setTimeout(() => dismiss(id), duration)
    }
  }

  return {
    toasts,
    info: (message: string, duration?: number) => push('info', message, duration),
    success: (message: string, duration?: number) => push('success', message, duration),
    warning: (message: string, duration?: number) => push('warning', message, duration),
    error: (message: string, duration?: number) => push('error', message, duration),
    dismiss,
  }
}
