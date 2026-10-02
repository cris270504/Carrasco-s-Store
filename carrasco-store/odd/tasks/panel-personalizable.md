# Panel personalizable (plantilla multi-negocio) — 2026-10-02

## Objetivo
Hacer configurables desde `/admin/configuracion`, sin tocar código, los 8 módulos que el
usuario eligió sobre el mapa de personalización actual:

1. Nombre, logo y favicon.
2. Contenido de la página de inicio (parcial — ver alcance).
3. Textos legales (términos y privacidad).
4. IGV, umbral de stock bajo y monto mínimo de pago con Mercado Pago.
5. Líneas de negocio activables (física/digital/servicio) — **solo ocultar del
   catálogo/inicio, no bloquear ni borrar nada** (decisión explícita, confirmada con el
   usuario: es reversible y no toca datos existentes).
6. Moneda (reemplazar el símbolo "S/" hardcodeado en ~19 archivos por un formateador
   centralizado).
7. Contacto y redes sociales (hoy variables de entorno: WhatsApp de avisos a dueños,
   correo remitente; además, redes sociales que hoy no existen en ningún lado).
8. Plantillas de correo (Resend) — **no de WhatsApp**: Meta exige que las plantillas de
   WhatsApp Business estén pre-aprobadas, así que su contenido no puede ser libremente
   editable desde nuestro panel.

## Alcance recortado (avisado al usuario, no silencioso)
- **Contenido del inicio**: se hace editable el badge/título/subtítulo del hero y los 3
  textos de "trust badges". El grid de 4 beneficios, los 3 bloques de tipo de producto
  (`offerTypes`) y los floaters quedan con su contenido actual fijo — modelarlos como
  contenido editable es un trabajo bastante más grande (listas anidadas con bullets) y no
  aporta tanto como el hero, que es lo primero que se ve.
- **Plantillas de mensajes**: solo `buyer_confirmation_email` y `license_delivery_email`
  (los dos 100% lineales). El aviso interno a los dueños (`owner_sale_email`) tiene lógica
  condicional (lista de líneas que varía según los datos) y es contenido operativo, no de
  cara al cliente — se deja en código.

## Alcance autorizado
Cambiar schema (nueva migración), endpoints de settings, `/admin/configuracion`, y los
puntos de consumo de las constantes que se vuelven configurables. No tocar la lógica de
pago/fulfillment más allá de leer el nuevo valor de `igvRate`/`mpMinAmount` en vez de la
constante. Commit y push al final (pedido explícito del usuario), junto con el trabajo ya
completado de `system-audit-fixes.md` y el fix de recuperación de contraseña de hoy.

## TDD
Sin test runner configurado (igual que `system-audit-fixes.md`). Checks funcionales:
`pnpm exec vue-tsc --noEmit` + `pnpm build`, más verificación manual en el navegador de
`/admin/configuracion` y del home.

## Decisiones de arquitectura
- Todo lo de valor simple (texto/número/booleano) se agrega como columnas nuevas a la
  tabla ya existente `store_settings` (fila única, mismo patrón que `shippingFlatRate`).
- Contenido estructurado (secciones legales) va en columnas `jsonb`.
- Plantillas de correo van en una tabla nueva `message_templates` (key/subject/body),
  con sustitución simple `{{variable}}` y el texto actual como valor por defecto si no
  hay fila.
- Moneda: nuevo `shared/utils/currency.ts` con `formatMoney(amount, currencyCode)`
  (via `Intl.NumberFormat`), reemplazando los literales "S/" existentes.
- IGV: `calcTax(subtotal, rate)` recibe el rate como parámetro (igual patrón que
  `calcShipping(hasPhysicalItem, rate)` ya usa para el envío).

## Tareas
- [x] T1 Leer schema, endpoints, composable y UI actuales de `store_settings` para no
      reinventar el patrón (hecho antes de escribir este archivo).
- [x] T2 Extender `server/database/schema.ts`: nuevas columnas en `storeSettings` +
      tabla `messageTemplates`.
- [x] T3 Migración `0009_store_settings_template_fields.sql` escrita a mano (ALTER TABLE
      ... IF NOT EXISTS, mismo patrón que 0002/0007) + policy RLS para `message_templates`
      en `supabase_rls_policies.sql`. Nota: `drizzle-kit generate` generó un archivo
      "recrear todo desde cero" porque `meta/_journal.json` nunca estuvo en git y solo
      tenía una entrada huérfana — se descartó ese archivo, no se aplicó. Falta correr
      `drizzle-kit push` al final (T16) para aplicarla de verdad a la base de datos.
- [x] T4 Actualizar `server/utils/settings.ts` (get/update) con todos los campos nuevos.
- [x] T5 Actualizar `server/api/admin/settings/index.patch.ts` con validación de los
      campos nuevos.
- [x] T6 Actualizar `app/composables/useStoreSettings.ts` (interfaz `StoreSettings`).
- [x] T7 `shared/utils/currency.ts` (formatMoney) + `shared/utils/pricing.ts` (calcTax
      con rate configurable). Verificado el formato de `Intl.NumberFormat` contra el
      literal anterior ("S/ 1,234.50" — igual, agrega separador de miles).
- [~] T8 Reemplazar los ~12 literales "S/" restantes por `formatMoney` — delegado,
      corriendo en paralelo (agente a3a9814d8094f5d91).
- [x] T9 `igvRate`/`lowStockThreshold`/`mpMinAmount`/`ownerWhatsappNumbers`/`senderEmail`
      ya se leen de settings en `checkout/init.post.ts`, `admin/metrics.get.ts`,
      `whatsapp.ts`, `resend.ts`, `notify.ts`, `cart.vue` (hecho directamente, no
      delegado: son cálculos de dinero).
- [~] T10 Filtrar catálogo/inicio/pie de página por línea de negocio activa; aviso en
      `ProductForm` si el tipo está desactivado — delegado, corriendo en paralelo
      (agente a8da8eda1244bda60).
- [x] T11 Tabla `message_templates` + `server/utils/messageTemplates.ts` (get/render) +
      integración en `resend.ts`/`notify.ts` (los 2 templates en alcance:
      `buyer_confirmation_email`, `license_delivery_email`).
- [x] T12 Home: hero badge/título/subtítulo/trust badges leídos de settings, con
      fallback al texto actual si están vacíos. (Nota: `index.vue` también lo tocó en
      paralelo el agente de T10 para el filtro de líneas de negocio — se verificó que
      ambos cambios conviven bien en el archivo, sin pisarse.)
- [x] T13 Términos/privacidad: secciones leídas de settings con fallback al array
      hardcodeado actual.
- [x] T14 Reescribir `/admin/configuracion` en pestañas con los 8 módulos (incluye
      endpoints nuevos `server/api/admin/message-templates/{index.get,[key].patch,
      [key].delete}.ts`).
- [x] T15 Nombre de marca dinámico en `app.vue` (título), `AppHeader.vue` (logo
      texto/imagen), `layouts/default.vue` (OG), `WelcomeModal.vue`, `index.vue`,
      `terminos.vue`, `privacidad.vue`, `AppFooter.vue` (2 literales).

## Correcciones tras los dos agentes delegados (T8/T10)
Ambos terminaron limpios (typecheck 0 errores cada uno) y sin pisarse con mi trabajo en
`index.vue` (quedó verificado que sus 3 ediciones conviven bien). Dos huecos que el agente
de T10 señaló explícitamente en vez de improvisar fuera de su alcance autorizado — los until
cerré yo:
- `app/components/ProductFilters.vue` no estaba en su lista de archivos permitidos, así que
  dejó el chip de un tipo desactivado visible (devolviendo 0 resultados) en vez de tocarlo.
  Lo arreglé: `typeOptions` ahora es un `computed` que oculta el chip según
  `useStoreSettings()`. De paso corregí el literal "Precio (S/)" que no estaba en la lista
  de T8 (ese componente no se había identificado en el mapeo inicial).
- `app/components/AppFooter.vue`: el agente de T10 solo agregó los `v-if` de líneas de
  negocio; el nombre de marca ("Carrasco Store" × 2) seguía fijo porque yo había dejado ese
  archivo para después, para no chocar con su edición en paralelo. Lo completé.
- [x] T16 Verificación:
  - `pnpm exec vue-tsc --noEmit`: 0 errores.
  - `pnpm build`: falló una vez por `{{ `{{${v}}}` }}` en el template de plantillas de
    correo (llaves literales dentro de una interpolación de Vue, el compilador las
    confunde con su propio delimitador). Corregido con una función `varToken()`.
    Build completo exitoso después.
  - `pnpm drizzle-kit push` se cayó con un error interno (`Cannot read properties of
    undefined (reading 'replace')` al parsear un CHECK constraint existente de la base —
    bug del propio drizzle-kit 0.31.10, no relacionado a mis cambios). Apliqué la
    migración `0009` directamente con el driver `postgres` del proyecto (mismo cliente
    que usa `server/utils/db.ts`), vía un script temporal con `node --env-file=.env`
    (nunca vi el valor de `DATABASE_URL`). Verificado con una consulta a
    `information_schema`: las 20 columnas nuevas y la tabla `message_templates` existen
    en la base real. Script temporal borrado.
  - Prueba manual en navegador: inicio con hero/trust badges en su fallback correcto,
    `/api/settings` devuelve los 20 campos nuevos con sus defaults, catálogo muestra
    "PRECIO (PEN)" dinámico y precios con `formatMoney`, `/admin/configuracion` sigue
    redirigiendo correctamente a `/catalogo` sin sesión de administrador.
  - **Limitación real, no simulada**: no tengo credenciales de administrador en este
    entorno, así que no pude probar dando clics el formulario de `/admin/configuracion`
    en sí (guardar cada pestaña, ver el resultado reflejado en la tienda). Recomiendo una
    pasada manual rápida del usuario con su propia cuenta de administrador.
- [x] T17 Commit(s) + push — ver mensaje final.

## Progreso
Completo.
