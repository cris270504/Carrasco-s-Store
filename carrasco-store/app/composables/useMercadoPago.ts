// Carga el SDK JS v2 de Mercado Pago una sola vez y expone un helper para
// montar el Payment Brick (Checkout API embebido). El numero de tarjeta se
// tokeniza en el navegador con este SDK; el backend nunca lo ve.

interface MercadoPagoSdk {
  new (publicKey: string, options?: { locale?: string }): MercadoPagoInstance
}
interface MercadoPagoInstance {
  bricks: () => { create: (type: string, containerId: string, settings: unknown) => Promise<BrickController> }
}
export interface BrickController {
  unmount: () => void
}

// Formato del formData que entrega el callback onSubmit del Payment Brick.
export interface BrickFormData {
  token: string
  payment_method_id: string
  payment_type_id?: string
  installments?: number | string
  issuer_id?: string
  payer?: { email?: string, identification?: { type?: string, number?: string } }
}

export interface BrickPayer {
  email?: string | null
  firstName?: string | null
  lastName?: string | null
}

let sdkPromise: Promise<void> | null = null

function loadSdk(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('El SDK de Mercado Pago solo carga en el navegador'))
  }
  if ((window as unknown as { MercadoPago?: unknown }).MercadoPago) {
    return Promise.resolve()
  }
  if (sdkPromise) return sdkPromise

  sdkPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://sdk.mercadopago.com/js/v2'
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => {
      sdkPromise = null
      reject(new Error('No se pudo cargar Mercado Pago. Revisa tu conexión e intenta de nuevo.'))
    }
    document.head.appendChild(script)
  })
  return sdkPromise
}

export function useMercadoPago() {
  let controller: BrickController | null = null

  async function mountPaymentBrick(opts: {
    publicKey: string
    containerId: string
    amount: number
    preferenceId?: string | null
    payer?: BrickPayer
    onSubmit: (formData: BrickFormData, paymentTypeId: string | undefined) => Promise<void>
    onReady?: () => void
    onError?: (error: unknown) => void
  }): Promise<void> {
    await loadSdk()

    const Sdk = (window as unknown as { MercadoPago: MercadoPagoSdk }).MercadoPago
    const mp = new Sdk(opts.publicKey, { locale: 'es-PE' })

    // Allow-list de medios de pago. Claves validas confirmadas contra la doc
    // oficial: creditCard, debitCard, prepaidCard, ticket, bankTransfer, atm,
    // mercadoPago. NO existe "digitalWallet" (usarla corrompe todo el
    // allow-list). 'mercadoPago' (Wallet, donde vive Yape) solo se agrega si
    // hay preferenceId y SIEMPRE redirige a MP; tarjeta/debito quedan
    // 100% embebidos. Omitir paymentMethods por completo -> el Brick falla
    // con 400 "No payment type was selected".
    const paymentMethods: Record<string, string> = {
      creditCard: 'all',
      debitCard: 'all',
      prepaidCard: 'all',
    }
    if (opts.preferenceId) {
      paymentMethods.mercadoPago = 'all'
    }

    controller = await mp.bricks().create('payment', opts.containerId, {
      initialization: {
        amount: opts.amount,
        ...(opts.preferenceId ? { preferenceId: opts.preferenceId } : {}),
        payer: opts.payer?.email
          ? {
              email: opts.payer.email,
              firstName: opts.payer.firstName ?? undefined,
              lastName: opts.payer.lastName ?? undefined,
            }
          : undefined,
      },
      customization: {
        paymentMethods,
        visual: { hidePaymentButton: false },
      },
      callbacks: {
        onReady: () => opts.onReady?.(),
        onError: (error: unknown) => opts.onError?.(error),
        onSubmit: ({ formData, additionalData }: { formData: BrickFormData, additionalData?: { paymentTypeId?: string } }) =>
          // El Brick mantiene su spinner hasta que esta promesa resuelva/rechace.
          opts.onSubmit(formData, additionalData?.paymentTypeId),
      },
    })
  }

  function unmount() {
    try {
      controller?.unmount()
    }
    catch {
      // el Brick ya se desmonto o el contenedor ya no existe
    }
    controller = null
  }

  onBeforeUnmount(unmount)

  return { mountPaymentBrick, unmount }
}
