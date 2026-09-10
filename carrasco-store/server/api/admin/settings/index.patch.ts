export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const body = await readBody(event)
  const patch: Parameters<typeof updateStoreSettings>[0] = {}

  if (body?.shippingFlatRate !== undefined) {
    const rate = Number(body.shippingFlatRate)
    if (!Number.isFinite(rate) || rate < 0) {
      throw createError({ statusCode: 400, statusMessage: 'El costo de envío debe ser un número mayor o igual a 0' })
    }
    patch.shippingFlatRate = rate
  }

  if ('whatsappNumber' in (body ?? {})) {
    const digits = String(body.whatsappNumber ?? '').replace(/[^\d]/g, '')
    if (digits && (digits.length < 8 || digits.length > 15)) {
      throw createError({ statusCode: 400, statusMessage: 'Número de WhatsApp no válido (usa formato internacional, ej. 51999888777)' })
    }
    // 9 digitos => numero local peruano, se antepone 51
    patch.whatsappNumber = digits ? (digits.length === 9 ? `51${digits}` : digits) : null
  }

  if ('whatsappCta' in (body ?? {})) {
    patch.whatsappCta = body.whatsappCta ? String(body.whatsappCta).trim().slice(0, 200) : null
  }

  if ('offerCountdownEndsAt' in (body ?? {})) {
    if (!body.offerCountdownEndsAt) {
      patch.offerCountdownEndsAt = null
    }
    else {
      const date = new Date(body.offerCountdownEndsAt)
      if (Number.isNaN(date.getTime())) {
        throw createError({ statusCode: 400, statusMessage: 'Fecha del contador no válida' })
      }
      patch.offerCountdownEndsAt = date
    }
  }

  if ('offerCountdownTitle' in (body ?? {})) {
    patch.offerCountdownTitle = body.offerCountdownTitle ? String(body.offerCountdownTitle).trim().slice(0, 120) : null
  }

  if ('offerCountdownUrl' in (body ?? {})) {
    const url = body.offerCountdownUrl ? String(body.offerCountdownUrl).trim() : ''
    if (url && !/^(\/|https?:\/\/)/.test(url)) {
      throw createError({ statusCode: 400, statusMessage: 'El enlace debe empezar con "/" o "https://"' })
    }
    patch.offerCountdownUrl = url ? url.slice(0, 255) : null
  }

  if (Object.keys(patch).length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Nada que actualizar' })
  }

  return updateStoreSettings(patch)
})
