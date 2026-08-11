import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../database/schema'

const client = postgres(process.env.DATABASE_URL!, {
  // Transaction pooler (puerto 6543) de Supabase: no soporta prepared statements
  prepare: false,
  max: 10,
})

export const db = drizzle(client, { schema })