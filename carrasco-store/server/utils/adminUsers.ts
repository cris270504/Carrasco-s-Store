import type { H3Event } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'

export interface AuthUserSummary {
  id: string
  email: string | null
  fullName: string | null
  createdAt: string
  active: boolean
}

// auth.users vive en el schema de Supabase, no en el que maneja Drizzle (ver
// CLAUDE.md), asi que la unica forma de listar clientes reales es el Admin
// API con la service_role key. Pagina hasta traer todos (tienda chica; si
// crece mucho esto deberia paginarse tambien en la UI).
export async function listAllAuthUsers(event: H3Event): Promise<AuthUserSummary[]> {
  const supabase = serverSupabaseServiceRole(event)
  const perPage = 200
  const users: AuthUserSummary[] = []
  let page = 1

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage })
    if (error || !data) break

    for (const u of data.users) {
      users.push({
        id: u.id,
        email: u.email ?? null,
        fullName: (u.user_metadata as { full_name?: string } | null)?.full_name ?? null,
        createdAt: u.created_at,
        active: !u.banned_until || new Date(u.banned_until) <= new Date(),
      })
    }

    if (data.users.length < perPage) break
    page += 1
  }

  return users
}

// Etiqueta consistente para mostrar un cliente por id (dashboard, listado de
// ordenes): mismo fallback en todos lados en vez de reimplementarlo por endpoint.
export function toUserNameMap(users: AuthUserSummary[]): Map<string, string> {
  return new Map(users.map(u => [u.id, u.fullName || u.email || 'Cliente']))
}
