import { desc, eq } from 'drizzle-orm'
import { serverSupabaseUser } from '#supabase/server'
import { addresses } from '../../database/schema'

// MVP de una sola direccion por cliente (la mas reciente / marcada default):
// el schema ya soporta varias (isDefault), pero no hay todavia un "libro de
// direcciones" en la UI, asi que alcanza con devolver la unica que importa
// para precargar el formulario de envio en el checkout.
export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event).catch(() => null)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Debes iniciar sesion' })
  }

  const address = await db.query.addresses.findFirst({
    where: eq(addresses.userId, user.sub),
    orderBy: [desc(addresses.isDefault)],
  })

  return address ?? null
})
