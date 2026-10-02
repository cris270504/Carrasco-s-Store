# Fixes del análisis de sistema (2026-09-17)

## Objetivo
Corregir los hallazgos del análisis de arquitectura, seguridad, checkout, modelo de datos y calidad de código de `carrasco-store`.

## TDD
Sin framework de test configurado en el proyecto (no hay vitest/playwright, no hay `test` script en package.json). Modo: **checks funcionales ordinarios** (typecheck con `vue-tsc`, build final), no ciclo RED/GREEN/REFACTOR. Fuente: ausencia de runner detectada, no elección explícita.

## Engram
Servidor Engram no disponible en esta sesión (ToolSearch no encontró las herramientas `mem_*`). Mirror pendiente — este archivo local es la única fuente de verdad hasta que se pueda sincronizar.

## Tareas

### Crítico
- [x] **T1** — Doble cobro en Mercado Pago: reclamo atómico de la orden antes de `createMpOrder()` en `server/api/checkout/confirm.post.ts`. Nuevo estado `payment_in_progress` (schema + migration `0008_order_payment_in_progress.sql`).

### Medio
- [x] **T2** — Loop de fulfillment envuelto en `db.transaction`; claim atómico ahora acepta `pending_payment` o `payment_in_progress`. Envío de email de licencia queda fuera de la transacción a propósito (pool de 3 conexiones no soporta tx larga + llamada de red externa) — documentado en comentario.
- [x] **T3** — Endpoint `server/api/admin/orders/[id]/reconcile.post.ts` + botón "Conciliar con MP" en `/admin/ordenes`.
- [x] **T4** — Policies `is_admin()` agregadas para `suppliers`, `manual_sales`, `payment_review_flags` en `supabase_rls_policies.sql` (sección nueva al final).
- [x] **T5** — `productHasSales` consulta `order_items` y `manual_sales` en paralelo.
- [x] **T6** — Comentario de `is_admin()` reforzado con explicación del riesgo de drift.
- [x] **T7** — `useSeoMeta` en `index.vue`, `catalogo/index.vue`, `producto/[slug].vue`.
- [x] **T8** — `server/api/__sitemap__/urls.ts` con productos activos.
- [x] **T9** — `shared/utils/margin.ts` (`calculateMargin`), aplicado en los 5 lugares que lo reimplementaban.

### Bajo
- [x] **T10** — Warning en build de producción si `NUXT_PUBLIC_SITE_URL` falta o sigue en el dominio de ejemplo.
- [x] **T11** — 14 secretos server-only migrados a `runtimeConfig` (confirmado: `app/` no expone ninguno).
- [x] **T12** — `public/_robots.txt` eliminado (confirmado que `@nuxtjs/robots` genera el real).
- [x] **T13** — Prop `priority` en `ProductCard.vue`; primeras 4 tarjetas del home con `loading="eager"` + `fetchpriority="high"`.
- [x] **T14** — Guard `phase.value === 'processing'` en `CheckoutPaymentModal.vue`.
- [x] **T15** — Catch de `suppliers` distingue `error.code === '23505'` de otros errores.
- [x] **T16** — Helpers `resolveSupplierId` (`server/utils/suppliers.ts`) y `parsePositiveAmount`/`parseNonNegativeAmount` (`server/utils/validation.ts`).
- [x] **T17** — `channel` inválido en ventas particulares rechaza con 400.
- [x] **T18** — `CLAUDE.md` actualizado (checkout/cart/orders ya implementados).

## Verificación final (orquestador)
- `pnpm exec vue-tsc --noEmit` integrado (todos los cambios juntos): 0 errores.
- `pnpm build`: build completo sin errores, `.output/` generado correctamente.

## División de trabajo (writers delegados, sin solapamiento de archivos)
- **Writer A (checkout)**: T1, T2, T3, T14
- **Writer B (datos/RLS)**: T4, T5, T6
- **Writer C (SEO)**: T7, T8, T10, T12
- **Writer D (calidad de código)**: T9, T15, T16, T17, T18
- **Writer E (arquitectura)**: T11, T13

## Verificación
`pnpm exec vue-tsc --noEmit` por writer (typecheck). Build completo (`pnpm build`) al final, por el orquestador, una sola vez con todos los cambios integrados.

## Estado
Completo — 18/18 tareas cerradas, typecheck y build integrados sin errores.

Revisión nativa (RDD, lineage `review-9b7d834894cb8a80`): consentida por el usuario, corrió el lens `review-reliability` y encontró 2 hallazgos CRITICAL reales en T3 (`reconcile.post.ts` no liberaba el reclamo en caso de no-aprobación; sin recuperación si faltaba mpOrderId/mpPaymentId local). Se aplicó la corrección acotada (1 sola permitida por candidato): agregado `findMpOrderByExternalReference` en `mercadopago.ts` + reset de status en los 3 caminos de `reconcile.post.ts`. El validador acotado detectó que esa primera corrección tenía una regresión (confundía "búsqueda en MP falló" con "MP confirma que no existe", arriesgando liberar el reclamo por un error transitorio). Se corrigió también (try/catch explícito: error de búsqueda → 502, no se libera; búsqueda exitosa sin resultado → se libera). El lineage quedó en `escalated` (terminal, el presupuesto de 1 corrección ya se había usado) — no se pudo re-validar automáticamente el segundo fix, pero el código actual sí resuelve ambos hallazgos originales y ya no tiene la regresión que el validador señaló. Typecheck limpio tras el fix final.

Segundo ciclo de revisión nativa (lineage `review-f4f26d6896b602e2`, consentido de nuevo por el usuario): encontró un tercer hallazgo real (R3-3, corroborado por el refuter) — las 3 ramas de `reconcile.post.ts` liberaban el reclamo (`status: 'pending_payment'`) ante CUALQUIER estado no aprobado, incluyendo estados en curso de MP (`processing`/`action_required`/`in_review`/`created` en Orders API; `in_process`/`pending` en Payments API), no solo estados terminales. Eso permitía que `confirm.post.ts` reclamara la misma orden para un segundo intento de cobro mientras el primero todavía podía resolver aprobado en MP — mismo riesgo de doble cobro que T1, reintroducido por mi propio fix de T3. Corregido: se agregaron `MP_ORDER_IN_FLIGHT_STATUSES` y `MP_PAYMENT_IN_FLIGHT_STATUSES`; ahora solo se libera el reclamo ante un estado terminal no aprobado, y ante un estado en curso se actualiza `paymentStatus` sin tocar `status` (sin liberar). Typecheck limpio tras el fix.

Este lineage también quedó `escalated` (terminal, sin ofrecer una segunda ronda de corrección para este ciclo). Con dos ciclos de revisión y tres hallazgos críticos reales corregidos, se pausó ahí en vez de lanzar un tercer ciclo sin consultar al usuario.

Pendiente: decisión del usuario sobre si correr un tercer ciclo de revisión nativa o continuar con commit/push bajo la política ordinaria del repo (la revisión es informativa, no bloquea la entrega).
