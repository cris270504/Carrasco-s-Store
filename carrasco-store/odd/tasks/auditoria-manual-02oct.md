# Correcciones de la bitácora de auditoría manual (02/10/2026)

## Objetivo
Corregir los 5 hallazgos que el usuario registró en `docs/Bitacora-Auditoria-Casos-de-Uso.docx`
tras probar la tienda en producción (CU-V01, CU-V02, CU-V04 ×2, CU-V06).

## Fuente
`docs/Bitacora-Auditoria-Casos-de-Uso.docx` (texto + 6 capturas de pantalla, leídas y
analizadas antes de planear). No se modifica ese documento.

## Decisiones del usuario (respuestas explícitas)
- Formato de precio del filtro: **consistente con `formatMoney`** ("S/ 2,000.00"), no el
  texto literal que escribió en la bitácora.
- El rango min/máx del filtro de precio pasa a ser **configurable desde el admin** (nuevo
  campo en Configuración, no solo un cambio de constante en código).
- Lista de marcas del filtro: **siempre todas**, sin importar el filtro de Tipo activo.

## Hallazgos y plan
1. **CU-V01** — Imagen de producto enorme con pocos destacados en el inicio. Fix:
   `minmax(230px, 280px)` en vez de `minmax(230px, 1fr)` en `.featured__grid`.
2. **CU-V02** — El contador de ofertas no queda fijo al hacer scroll. Fix: `position: fixed`
   en `OfferCountdown.vue` + padding-bottom en el contenido de `index.vue`.
3. **CU-V04a** — Filtro de precio: tope configurable desde admin (nuevos campos
   `catalogMinPrice`/`catalogMaxPrice` en `store_settings`, default 0/2000), con etiquetas
   formateadas "(mín.)"/"(máx.)" junto a cada número.
4. **CU-V04a** — Filtro de marca: nuevo endpoint con las marcas reales de la BD (de
   productos activos y de líneas de negocio habilitadas), chips de selección múltiple
   (toggle individual), máx. 5 visibles + "Ver más", mensaje si no hay ninguna.
5. **CU-V04b** — Texto de stock/tiempo más grande en las tarjetas; se elimina el código
   "#XXXXXX" (no se usa en ningún otro lado del catálogo público).
6. **CU-V06a** — Sin estado de carga en las tarjetas de catálogo/inicio al agregar (sí lo
   tiene la página de producto) — se agrega, mismo patrón ("Agregando…" + disabled).
7. **CU-V06b** — Mensaje "Stock insuficiente (disponible: N)" no aclara que esas N ya
   están en el carrito del usuario. Se reformula para mencionarlo explícitamente.

## Alcance autorizado
Cambiar schema (nueva migración aditiva), endpoints de catálogo/carrito, componentes de
front (ProductCard, ProductFilters, OfferCountdown, index.vue, catalogo/index.vue),
`/admin/configuracion` (2 campos nuevos en la pestaña Reglas de negocio). Commit y push al
final (pedido explícito).

## TDD
Sin test runner configurado (igual que las tareas anteriores). Checks: `vue-tsc --noEmit`
+ `pnpm build`, verificación manual en navegador del catálogo/inicio/carrito (sin admin:
la config nueva no se puede probar con clics reales, igual que antes).

## División de trabajo
- **Yo directamente** (T1-T6): schema + migración + settings + admin UI del rango de
  precio; filtro de marca completo (endpoint, composable, ProductFilters.vue, query del
  catálogo) — son cambios interdependientes que requieren coherencia estricta entre sí.
- **Escritor delegado** (T7-T10): CU-V01 (grid del inicio), CU-V02 (OfferCountdown fijo +
  padding de index.vue), CU-V04b + CU-V06a (ProductCard: texto más grande, quitar
  ticket, prop de carga) + wiring del estado de carga en index.vue/catalogo/index.vue,
  CU-V06b (mensaje de stock en el endpoint del carrito). Archivos sin solape con los míos.

## Tareas
- [x] T1 Schema: `catalogMinPrice`/`catalogMaxPrice` en `storeSettings`.
- [x] T2 Migración `0010_catalog_price_range.sql`.
- [x] T3 `server/utils/settings.ts` + `server/api/admin/settings/index.patch.ts` +
      `useStoreSettings.ts` con los 2 campos nuevos.
- [x] T4 `/admin/configuracion`: campos de rango de precio en la pestaña Reglas de negocio.
- [x] T5 `GET /api/products/brands` (marcas reales, respeta activos + líneas habilitadas).
- [x] T6 `useProductFilters.ts` (marca como array) + `ProductFilters.vue` (chips
      multi-select con "Ver más", slider con tope configurable y etiquetas formateadas) +
      `server/api/products/index.get.ts` (filtro por lista de marcas exactas).
- [x] T7 `index.vue`: grid de destacados no se estira con pocos productos (delegado).
- [x] T8 `OfferCountdown.vue` fijo abajo + espacio reservado en `index.vue` (delegado).
- [x] T9 `ProductCard.vue`: quitar "#código", agrandar disponibilidad, prop `adding`;
      wiring en `index.vue` y `catalogo/index.vue` (delegado).
- [x] T10 `server/api/cart/items.post.ts`: mensaje de stock que menciona lo ya agregado
      (delegado) — **corregido por mí tras probarlo**: el mensaje del delegado decía
      "es todo el stock disponible" incluso cuando lo ya agregado era MENOR al stock
      (ej. 1 en el carrito, stock 2, intento de agregar 2 más) — técnicamente engañoso.
      Ahora distingue ambos casos.
- [x] T11 Verificación:
      - `vue-tsc --noEmit` y `pnpm build`: limpios, dos veces (antes y después del fix
        del mensaje de stock).
      - Migración aplicada a la base real con el driver `postgres` directo (`drizzle-kit
        push` sigue roto por el mismo bug de siempre); columnas verificadas en
        `information_schema`.
      - Navegador: grid de 1-3 destacados ya no se estira; banda de ofertas confirmada
        `position: fixed` con `getBoundingClientRect()` (la captura de pantalla
        escalada inducía a pensar que no se veía — no era un bug real); filtro de marca
        probado con clic real (chip activo, URL `?brand=Microsoft`, resultados
        filtrados a 4); precio con tope 2000 y etiquetas "(mín.)/(máx.)" formateadas;
        texto de stock confirmado en 14px/600 vía `getComputedStyle`; estado
        "Agregando…" capturado en pantalla durante un clic real; mensaje de stock
        probado con una secuencia determinística vía `fetch` (limpié el carrito de
        prueba de la base real después).
- [x] T12 Commit(s) + push.

## Progreso
Completo.
