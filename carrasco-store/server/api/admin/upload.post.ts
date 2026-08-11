import { serverSupabaseServiceRole } from '#supabase/server'

const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
const MAX_SIZE = 5 * 1024 * 1024
const BUCKET = 'product-images'

// Sube al bucket público de Supabase Storage con el service role: el cliente
// solo maneja auth (regla del proyecto), la subida real y sus permisos viven
// aquí, detrás de requireAdmin.
export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const files = await readMultipartFormData(event)
  const file = files?.find(f => f.name === 'file')

  if (!file || !file.data || !file.type) {
    throw createError({ statusCode: 400, statusMessage: 'Archivo requerido' })
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    throw createError({ statusCode: 400, statusMessage: 'Formato de imagen no permitido (usa PNG, JPG, WEBP o GIF)' })
  }
  if (file.data.length > MAX_SIZE) {
    throw createError({ statusCode: 400, statusMessage: 'La imagen supera el tamaño máximo de 5MB' })
  }

  const extension = file.type.split('/')[1]
  const path = `${crypto.randomUUID()}.${extension}`

  const supabase = serverSupabaseServiceRole(event)
  const { error } = await supabase.storage.from(BUCKET).upload(path, file.data, {
    contentType: file.type,
    upsert: false,
  })

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'No se pudo subir la imagen' })
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)

  return { url: data.publicUrl }
})
