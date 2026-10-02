// Formateador de moneda centralizado para que el simbolo/formato salga igual
// en toda la tienda (antes "S/ " estaba escrito a mano en ~19 archivos). El
// currencyCode viene de store_settings; DEFAULT_CURRENCY es el fallback
// mientras no haya fila de configuracion o no se haya podido cargar aun.
export const DEFAULT_CURRENCY = 'PEN'

const LOCALE_BY_CURRENCY: Record<string, string> = {
  PEN: 'es-PE',
  USD: 'en-US',
  MXN: 'es-MX',
  COP: 'es-CO',
  CLP: 'es-CL',
  ARS: 'es-AR',
}

export function formatMoney(amount: number, currencyCode: string = DEFAULT_CURRENCY) {
  const code = currencyCode || DEFAULT_CURRENCY
  const locale = LOCALE_BY_CURRENCY[code] || 'es-PE'
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency: code, currencyDisplay: 'narrowSymbol' }).format(amount)
  }
  catch {
    // Codigo de moneda no reconocido por Intl: no reventar el render, mostrar el numero con el codigo.
    return `${code} ${amount.toFixed(2)}`
  }
}
