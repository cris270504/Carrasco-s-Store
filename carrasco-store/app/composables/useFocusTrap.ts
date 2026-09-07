// Trampa de foco minima para modales via Teleport (ConfirmDialog, WelcomeModal):
// mueve el foco adentro al abrir, lo retiene con Tab/Shift+Tab mientras esta
// abierto, y lo devuelve al elemento que lo origino al cerrar. Sin esto, un
// usuario de teclado puede tabular hacia contenido oculto detras del overlay
// y perder su posicion en la pagina al cerrar el dialogo.
export function useFocusTrap(containerRef: Ref<HTMLElement | null>, active: Ref<boolean>) {
  let previouslyFocused: HTMLElement | null = null

  function getFocusable(): HTMLElement[] {
    if (!containerRef.value) return []
    return Array.from(
      containerRef.value.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
      ),
    )
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key !== 'Tab') return
    const focusable = getFocusable()
    if (focusable.length === 0) return

    const first = focusable[0]!
    const last = focusable[focusable.length - 1]!

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    }
    else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  watch(active, (isActive) => {
    if (isActive) {
      previouslyFocused = document.activeElement as HTMLElement | null
      nextTick(() => getFocusable()[0]?.focus())
      window.addEventListener('keydown', handleKeydown)
    }
    else {
      window.removeEventListener('keydown', handleKeydown)
      previouslyFocused?.focus()
      previouslyFocused = null
    }
  })

  onBeforeUnmount(() => window.removeEventListener('keydown', handleKeydown))
}
