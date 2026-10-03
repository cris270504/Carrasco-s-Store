export interface ConfirmOptions {
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'danger'
  // Aviso de un solo boton: oculta "Cancelar".
  notice?: boolean
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
    // Si ya habia una solicitud pendiente (se abrio un segundo dialogo antes
    // de responder el primero), se resuelve como cancelada en vez de perderla:
    // sin esto, el primer `await confirm()` quedaba colgado para siempre.
    request.value?.resolve(false)

    return new Promise((resolve) => {
      request.value = { ...options, resolve }
    })
  }
}
