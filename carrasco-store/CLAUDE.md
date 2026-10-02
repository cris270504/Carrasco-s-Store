# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

An e-commerce store (Nuxt 4 + Vue 3) selling a mix of item types from a single cart: physical products, digital licenses/codes, and bookable technical services. Backend uses Nitro server routes with Drizzle ORM over Postgres (Supabase). Auth is handled by Supabase (`@nuxtjs/supabase`). UI copy and comments are in Spanish — match that convention when editing existing files.

Package manager is **pnpm** (`pnpm-lock.yaml`, `pnpm-workspace.yaml` present) — use `pnpm`, not `npm`/`yarn`.

## Commands

```bash
pnpm install       # install deps (also runs `nuxt prepare` via postinstall)
pnpm dev           # start dev server at http://localhost:3000
pnpm build         # production build
pnpm generate      # static generation
pnpm preview       # preview a production build locally
```

No test runner or lint script is currently configured in `package.json`.

Database (Drizzle Kit, config in `drizzle.config.ts`, schema in `server/database/schema.ts`, migrations output to `server/database/migrations`):

```bash
pnpm drizzle-kit generate   # generate SQL migrations from schema.ts changes
pnpm drizzle-kit migrate    # apply migrations
pnpm drizzle-kit push       # push schema directly (no migration files)
pnpm drizzle-kit studio     # browse the DB
```

Requires `DATABASE_URL` (Postgres/Supabase connection string), `SUPABASE_URL`, and `SUPABASE_KEY` in `.env`.

## Architecture

**Nuxt 4 directory layout** — note the app code lives under `app/`, not the project root:
- `app/` — frontend: `pages/` (file-based routing), `components/`, `composables/`, `middleware/`, `types/`, `assets/css/`
- `server/` — Nitro backend: `api/**/*.get.ts` (etc.) define server routes matching the filename; `database/schema.ts` is the single Drizzle schema source; `utils/db.ts` exports the shared `db` client
- `shared/` — code importable from **both** `app/` and `server/` without duplication (a Nuxt 4 convention). `shared/utils/productTypes.ts` is the canonical example: one array of valid product types validated identically on client and server. Put any cross-boundary constant/type/validator here rather than redefining it in both layers.
- Server API handlers auto-import `db` and Drizzle query helpers (`and`, `eq`, `gte`, etc. from `drizzle-orm`) — no need to import `defineEventHandler`, `getQuery`, etc., they're Nuxt auto-imports.

**Database schema** (`server/database/schema.ts`) is the source of truth for the domain model. Key points to understand before touching commerce logic:
- `products.type` is one of `service | physical | digital` (see `itemTypeEnum`, mirrored in `shared/utils/productTypes.ts`). Downstream tables branch on this:
  - `physical` → stock lives on `products.stock` (when no variant) or per-row on `productVariants.stock`; `productVariants` covers things like capacity/color/size.
  - `digital` → fulfillment is a pool of `digitalLicenses` rows (status `available/reserved/delivered`); `digitalLicenses.code` is expected to be encrypted at the application layer before storage, not the DB layer.
  - `service` → `serviceDetails` holds duration/default modality; a purchased service produces a `serviceBookings` row (status machine: `pending → confirmed → in_progress → completed`, or `cancelled`).
- `cartItems` and `orderItems` are shaped to hold any of the three item types in one row (`itemType` + optional `variantId`/`preferredScheduleAt`/`preferredModality`), so cart/checkout logic must branch on `itemType` rather than assuming a plain SKU model.
- `orders` carries Mercado Pago fields (`mpPaymentId`, `mpPreferenceId`, `paymentStatus`) — payment integration is Mercado Pago, not Stripe.
- `addresses`, `carts`, `orders`, `serviceBookings` store `userId` as a bare `uuid` with **no physical FK** — it references Supabase's `auth.users`, which lives in a different Postgres schema Drizzle doesn't manage.
- Drizzle `relations()` are defined for nested queries (`db.query.products.findMany({ with: { variants: true, ... } })`); prefer that query style over manual joins when fetching related rows, consistent with `server/api/products/index.get.ts`.

**Auth**: `useSupabaseUser()` / `useSupabaseClient()` (from `@nuxtjs/supabase`) are the auto-imported composables for auth state and calls (see `app/pages/login.vue`). Route protection uses Nuxt route middleware (`app/middleware/auth.ts`) which redirects unauthenticated users to `/login?redirect=<original path>`; apply it to a page via `definePageMeta({ middleware: 'auth' })`. `supabase.redirect` is disabled in `nuxt.config.ts` (no automatic redirect-on-login-required — protection is opt-in per page via the middleware).

**Filters/query pattern**: `app/composables/useProductFilters.ts` shows the established pattern for list filtering — a reactive filters object synced two-way with the route query string (so searches are shareable/bookmarkable), passed straight into `useFetch('/api/products', { query: filters })`. Follow this pattern for any new filterable list rather than introducing separate client-side filter state.

Cart/checkout/order endpoints are implemented: `server/api/cart/**` (cart CRUD), `server/api/checkout/**` (Mercado Pago Checkout API via Orders/Payment Brick — `init`, `confirm`, `webhook`), and `server/api/orders/**`. Product detail pages also exist (`app/pages/producto/[slug].vue`). Check remaining `TODO` markers in the codebase before assuming a given piece is still pending.

# Reglas del Proyecto: Carrasco Store

## 1. Idioma
- DEBES responder, explicar y comentar el código estrictamente en ESPAÑOL.
- Los nombres propios del framework, APIs, métodos, propiedades y conceptos técnicos pueden mantenerse en inglés cuando corresponda.

## 2. Stack y arquitectura
- Framework: Nuxt 3/4 con estructura basada en `app/`.
- Frontend: Vue 3 + Composition API.
- ORM: Drizzle ORM.
- Autenticación: Supabase Auth.
- Base de datos: gestionada mediante Drizzle ORM desde el servidor.
- El frontend NUNCA debe realizar consultas directas a la base de datos.
- Drizzle NUNCA debe ser importado ni ejecutado en código del cliente.

## 3. Acceso a datos
- TODO acceso a datos debe realizarse mediante endpoints ubicados en `server/api/`.
- Esto incluye:
  - SELECT
  - INSERT
  - UPDATE
  - DELETE
  - Consultas relacionadas
  - Operaciones transaccionales
- Los componentes, composables y páginas del frontend deben comunicarse con el backend mediante `$fetch`/`useFetch` o mecanismos equivalentes de Nuxt.
- Supabase debe utilizarse ÚNICAMENTE para autenticación, salvo que se indique explícitamente lo contrario.

## 4. Seguridad
- Nunca expongas credenciales, claves privadas, variables de entorno del servidor ni conexiones de base de datos al cliente.
- Las operaciones con Drizzle, credenciales privadas y lógica sensible deben permanecer en `server/`.
- Valida y sanitiza los datos recibidos por los endpoints.
- No confíes en datos enviados directamente desde el cliente.

## 5. Modificación del proyecto
- Antes de crear nuevos archivos, carpetas, composables, endpoints o dependencias, revisa la estructura y reutiliza lo que ya existe.
- Respeta los patrones y convenciones existentes del proyecto.
- No introduzcas librerías nuevas si la funcionalidad puede resolverse utilizando las dependencias existentes.
- No cambies tecnologías ni arquitectura sin indicarlo explícitamente.
- No inventes tablas, columnas, relaciones, endpoints, tipos o funcionalidades que no existan en el proyecto.
- Si falta información necesaria, indícalo antes de asumir una estructura.

## 6. Código
- Utiliza Composition API en Vue.
- Prioriza código simple, mantenible y eficiente.
- Evita duplicación de código.
- Utiliza TypeScript cuando el proyecto lo tenga habilitado.
- Mantén separación clara entre:
  - UI
  - lógica de negocio
  - acceso a API
  - acceso a base de datos
- No coloques lógica de base de datos en componentes, páginas o composables del cliente.

## 7. Rendimiento
- Prioriza soluciones eficientes y simples.
- Evita consultas innecesarias a la API.
- Evita renders y cálculos innecesarios en Vue.
- No agregues abstracciones o complejidad que no aporten valor.
- Prefiere reutilizar datos ya disponibles antes de realizar nuevas solicitudes.

## 8. Estilo de respuesta
- Sé DIRECTO y CONCISO.
- No des explicaciones largas a menos que se soliciten.
- Cuando se solicite una modificación de código:
  1. Indica brevemente qué archivo(s) modificar.
  2. Proporciona únicamente el código necesario para realizar el cambio.
  3. No repitas código que no haya cambiado.
- Si se solicita un archivo completo, proporciona el archivo completo.
- No incluyas explicaciones innecesarias después del código.
- Si detectas un problema importante de arquitectura, seguridad o rendimiento, adviértelo brevemente antes de proponer la solución.

## 9. Regla principal
Antes de escribir código, verifica que la solución:
- Respete Nuxt + Vue 3 + Composition API.
- Mantenga Drizzle exclusivamente en servidor.
- Utilice `server/api/` para el acceso a datos.
- Utilice Supabase únicamente para Auth.
- Respete la estructura existente del proyecto.
- No introduzca dependencias o complejidad innecesarias.