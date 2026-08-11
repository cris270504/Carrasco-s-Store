export interface ConfirmOptions {
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'danger'
}

interface ConfirmRequest extends ConfirmOptions {
  resolve: (value: boolean) => void
}

// Estado compartido: el composable lo escribe, ConfirmDialog.vue (montado
// una sola vez en app.vue) lo lee y resuelve la promesa cuando el usuario responde.
export function useConfirmState() {
  return useState<ConfirmRequest | null>('confirm-dialog-request', () => null)
}

export function useConfirm() {
  const request = useConfirmState()

  return function confirm(options: ConfirmOptions): Promise<boolean> {
    return new Promise((resolve) => {
      request.value = { ...options, resolve }
    })
  }
}
