import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../database/schema'

const client = postgres(process.env.DATABASE_URL!, {
  // Transaction pooler (puerto 6543) de Supabase: no soporta prepared statements
  prepare: false,
  // En serverless (Vercel) cada invocacion fria crea su propio pool: con
  // max:10 bastan ~5-10 invocaciones concurrentes para agotar el limite de
  // conexiones del pooler. Un pool chico por instancia es lo correcto cuando
  // ya hay un pooler delante (el pooler multiplexa, no cada funcion).
  max: 3,
})

export const db = drizzle(client, { schema })