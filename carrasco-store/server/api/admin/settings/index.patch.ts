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

  // ---- Marca ----
  if ('storeName' in (body ?? {})) {
    const name = String(body.storeName ?? '').trim()
    if (!name) {
      throw createError({ statusCode: 400, statusMessage: 'El nombre de la tienda no puede estar vacío' })
    }
    patch.storeName = name.slice(0, 80)
  }
  if ('logoUrl' in (body ?? {})) {
    patch.logoUrl = body.logoUrl ? String(body.logoUrl).trim().slice(0, 500) : null
  }
  if ('faviconUrl' in (body ?? {})) {
    patch.faviconUrl = body.faviconUrl ? String(body.faviconUrl).trim().slice(0, 500) : null
  }

  // ---- Reglas de negocio ----
  if (body?.igvRate !== undefined) {
    const rate = Number(body.igvRate)
    if (!Number.isFinite(rate) || rate < 0 || rate > 1) {
      throw createError({ statusCode: 400, statusMessage: 'El IGV debe ser un número entre 0 y 1 (ej. 0.18 para 18%)' })
    }
    patch.igvRate = rate
  }
  if (body?.lowStockThreshold !== undefined) {
    const threshold = Number(body.lowStockThreshold)
    if (!Number.isInteger(threshold) || threshold < 0) {
      throw createError({ statusCode: 400, statusMessage: 'El umbral de stock bajo debe ser un entero mayor o igual a 0' })
    }
    patch.lowStockThreshold = threshold
  }
  if (body?.mpMinAmount !== undefined) {
    const amount = Number(body.mpMinAmount)
    if (!Number.isFinite(amount) || amount < 0) {
      throw createError({ statusCode: 400, statusMessage: 'El monto mínimo debe ser un número mayor o igual a 0' })
    }
    patch.mpMinAmount = amount
  }
  if ('currencyCode' in (body ?? {})) {
    const code = String(body.currencyCode ?? '').trim().toUpperCase()
    if (!/^[A-Z]{3}$/.test(code)) {
      throw createError({ statusCode: 400, statusMessage: 'El código de moneda debe tener 3 letras (ej. PEN, USD)' })
    }
    patch.currencyCode = code
  }

  // ---- Líneas de negocio activas ----
  if (body?.physicalEnabled !== undefined) patch.physicalEnabled = Boolean(body.physicalEnabled)
  if (body?.digitalEnabled !== undefined) patch.digitalEnabled = Boolean(body.digitalEnabled)
  if (body?.serviceEnabled !== undefined) patch.serviceEnabled = Boolean(body.serviceEnabled)

  // ---- Contacto y redes ----
  if ('ownerWhatsappNumbers' in (body ?? {})) {
    const raw = String(body.ownerWhatsappNumbers ?? '')
    const numbers = raw.split(',').map(n => n.replace(/[^\d]/g, '')).filter(Boolean)
    for (const n of numbers) {
      if (n.length < 8 || n.length > 15) {
        throw createError({ statusCode: 400, statusMessage: `Número de WhatsApp no válido: "${n}"` })
      }
    }
    patch.ownerWhatsappNumbers = numbers.length ? numbers.join(',') : null
  }
  if ('senderEmail' in (body ?? {})) {
    patch.senderEmail = body.senderEmail ? String(body.senderEmail).trim().slice(0, 200) : null
  }
  if ('facebookUrl' in (body ?? {})) patch.facebookUrl = body.facebookUrl ? String(body.facebookUrl).trim().slice(0, 255) : null
  if ('instagramUrl' in (body ?? {})) patch.instagramUrl = body.instagramUrl ? String(body.instagramUrl).trim().slice(0, 255) : null
  if ('tiktokUrl' in (body ?? {})) patch.tiktokUrl = body.tiktokUrl ? String(body.tiktokUrl).trim().slice(0, 255) : null

  // ---- Contenido del inicio ----
  if ('homeHeroBadge' in (body ?? {})) patch.homeHeroBadge = body.homeHeroBadge ? String(body.homeHeroBadge).trim().slice(0, 120) : null
  if ('homeHeroTitle' in (body ?? {})) patch.homeHeroTitle = body.homeHeroTitle ? String(body.homeHeroTitle).trim().slice(0, 200) : null
  if ('homeHeroSubtitle' in (body ?? {})) patch.homeHeroSubtitle = body.homeHeroSubtitle ? String(body.homeHeroSubtitle).trim().slice(0, 400) : null
  if ('homeTrustBadges' in (body ?? {})) {
    if (body.homeTrustBadges === null) {
      patch.homeTrustBadges = null
    }
    else {
      if (!Array.isArray(body.homeTrustBadges)) {
        throw createError({ statusCode: 400, statusMessage: 'Los textos destacados deben ser una lista' })
      }
      patch.homeTrustBadges = body.homeTrustBadges.map((b: { icon?: unknown, text?: unknown }) => ({
        icon: String(b?.icon ?? '').slice(0, 30),
        text: String(b?.text ?? '').trim().slice(0, 60),
      })).filter((b: { text: string }) => b.text)
    }
  }

  // ---- Textos legales ----
  const parseSections = (value: unknown, field: string) => {
    if (value === null) return null
    if (!Array.isArray(value)) {
      throw createError({ statusCode: 400, statusMessage: `${field} debe ser una lista de secciones` })
    }
    return value.map((s: { title?: unknown, body?: unknown }) => ({
      title: String(s?.title ?? '').trim().slice(0, 200),
      body: String(s?.body ?? '').trim(),
    })).filter((s: { title: string, body: string }) => s.title || s.body)
  }
  if ('legalTermsSections' in (body ?? {})) patch.legalTermsSections = parseSections(body.legalTermsSections, 'Los términos y condiciones')
  if ('legalPrivacySections' in (body ?? {})) patch.legalPrivacySections = parseSections(body.legalPrivacySections, 'La política de privacidad')

  if (Object.keys(patch).length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Nada que actualizar' })
  }

  return updateStoreSettings(patch)
})
