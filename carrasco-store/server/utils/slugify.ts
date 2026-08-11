import { eq } from 'drizzle-orm'
import { products } from '../database/schema'

export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Sufija con un fragmento aleatorio si el slug base ya existe, evitando otro
// round-trip a la base de datos solo para "adivinar" un slug libre.
export function slugWithSuffix(base: string): string {
  return `${base}-${Math.random().toString(36).slice(2, 7)}`
}

export async function generateUniqueSlug(name: string): Promise<string> {
  const base = slugify(name) || 'producto'
  let slug = base

  for (let attempt = 0; attempt < 5; attempt++) {
    const existing = await db.query.products.findFirst({
      where: eq(products.slug, slug),
      columns: { id: true },
    })
    if (!existing) return slug
    slug = slugWithSuffix(base)
  }

  throw createError({ statusCode: 500, statusMessage: 'No se pudo generar un slug único' })
}
