# Ajustes: grid de destacados, filtro de precio por tramos y carrito instantáneo

## Objetivo
Corregir tres puntos de la auditoría manual (CU-V01 y CU-V04/CU-V06 en el carrito):
1. Destacados del inicio: 1 a 4 productos en una sola línea.
2. Filtro de precio como casillas de tramos (estilo de referencia) con tramo editable desde admin.
3. Botones +, − y ✕ del carrito: que el cambio se vea al instante.

## Decisiones
- Tramo por defecto S/ 25, editable en `/admin/configuracion` (pestaña Reglas de negocio),
  junto al mínimo y máximo que ya existían.
- Casillas de selección única: un solo tramo activo a la vez (ver nota en el reporte).
- Las etiquetas usan `formatMoney` (2 decimales), igual que el resto del sitio.

## Tareas
- [x] T1 Schema + migración `0011_catalog_price_step.sql` (`catalogPriceStep`, default 25),
      aplicada a la base real y verificada en `information_schema`.
- [x] T2 `server/utils/settings.ts`, `server/api/admin/settings/index.patch.ts` (validación > 0),
      `useStoreSettings.ts`.
- [x] T3 `/admin/configuracion`: campo de tramo con validación (> 0 y ≤ rango total).
- [x] T4 `ProductFilters.vue`: slider reemplazado por casillas de tramos derivadas de
      `minPrice`/`maxPrice` (la URL sigue siendo la fuente de verdad).
- [x] T5 `index.vue`: destacados en una fila desde 900px (flex nowrap); centrado con pocos productos.
- [x] T6 `useCart.ts`: actualización optimista en `setQuantity`/`removeItem` con resincronización si falla.
- [x] T7 `server/api/cart/items/[id].patch.ts`: validación de stock en PATCH (antes podía
      superar el stock; el POST ya lo validaba).
- [x] T8 Verificación: `pnpm build` limpio; grid con 1, 2, 3 y 4 productos en una fila
      (medido con `getBoundingClientRect`); filtro de precio probado con clics reales y URL;
      carrito: `+` visible en ~10 ms, X en ~12 ms; `+` por encima del stock revierte y el servidor responde 400.
- [ ] T9 Commit + push.

## Pendiente de verificación manual
- Pantalla `/admin/configuracion` (campo de tramo): sin credenciales de admin en esta sesión.
