# Casos de uso RUP en Word — Carrasco Store

## Objetivo
Documento Word con TODOS los casos de uso del sistema, separados por actores, con especificación RUP completa.
Incluye los casos implementados y los pendientes (marcados como no implementados).

## Decisiones del usuario (respuestas explícitas)
- Alcance: implementados + pendientes, los pendientes deben indicar que aún no están implementados.
- Detalle: especificación RUP completa por caso de uso.
- Actores: Visitante, Cliente registrado, Administrador, Sistemas externos.
- Extras: matriz actor vs caso de uso, diagrama de casos de uso, reglas de negocio clave.
- Formato: un único archivo .docx.

## Alcance autorizado
Solo generar documentación. No modificar código fuente de la tienda. Salida: `docs/Casos-de-Uso-RUP-Carrasco-Store.docx`
(sin commit). Trabajo intermedio en el scratchpad de la sesión.

## Tareas
- [x] T1 Inventario de páginas, endpoints y funciones (Glob + lectura de reconcile/producto/admin).
- [x] T2 Catálogo de 88 casos de uso + 26 reglas de negocio (`catalog.json`, `rules.json`).
- [x] T3 Redacción de las especificaciones RUP por actor (un writer delegado). 88 casos + CU-C26 agregado por hallazgo (carrito de invitado no se traslada al iniciar sesión).
- [x] T4 Validación de datos (validate.js: IDs, campos, referencias) — OK con 89 casos.
- [x] T5 Diagramas UML por actor (SVG -> PNG con sharp), revisados visualmente (se corrigieron 2 defectos de layout).
- [x] T6 Generación del .docx (docx-js): portada, índice, actores, matriz, reglas, especificaciones, anexos A y B.
- [x] T7 Validación XSD del .docx: PASSED. Sin render a PDF (no hay LibreOffice). Entregado en docs/.

## Checks aplicables
- TDD: no aplica (documentación). Runner: ninguno.
- JSON válido, 88 IDs únicos coincidentes con el catálogo, referencias RN-xx / CU-xx existentes.
- `validate.py` del skill docx sobre el archivo final. No hay LibreOffice: no se puede renderizar a PDF.

## Progreso
T1 y T2 completas. Siguiente: T3.

## Notas
Espejo Engram pendiente: las herramientas de memoria no están disponibles en esta sesión.

- [x] T8 (ampliación) Nueva sección 5: 89 diagramas de flujo (uno por caso de uso, generados desde flujo básico + alternos) más leyenda; secciones 6, 7 y 8 renumeradas. Validación XSD: PASSED. Entregado como docs/Casos-de-Uso-RUP-Carrasco-Store-v1.1.docx (el v1.0 estaba bloqueado por otro proceso).

## v1.2 — Auditoría (01/10/2026)
Se empaquetó el flujo en la skill de usuario `rup-use-case-docs` (~/.claude/skills/) y se usó esa skill para re-verificar el dataset contra el código ACTUAL (había cambios sin commitear desde la v1.1).

- [x] T9 Migración del dataset al esquema de la skill: creado `data/actors.json` (antes la jerarquía Visitante/Cliente registrado estaba hardcodeada); renombrados `uc-cliente.json`→`uc-cliente-registrado.json`, `uc-admin.json`→`uc-administrador.json`, `uc-sistemas.json`→`uc-sistemas-externos.json`.
- [x] T10 Re-exploración dirigida (1 subagente Explore) de los archivos modificados/nuevos desde la v1.1 (fulfillment.ts, checkout/confirm.post.ts, mercadopago.ts, productSales.ts, admin/orders/[id]/reconcile.post.ts nuevo, suppliers.ts, validation.ts, margin.ts, schema.ts, migración 0008) contra el catálogo existente. Verifiqué yo mismo (Grep + Read) el hallazgo más severo antes de aceptarlo.
- [x] T11 Correcciones de auditoría aplicadas al dataset:
  - **CU-C11** (brecha real): el altFlow 6b decía "mantiene reclamada la orden" ante un pago en revisión; el código la libera siempre a `pending_payment`. Corregido el texto.
  - **CU-C03** (hallazgo nuevo, no corregido en código — fuera de alcance): `app/types/order.ts:35` y `app/pages/dashboard/index.vue:17-25` no incluyen el estado `payment_in_progress`; un pedido en ese estado se vería sin etiqueta en el historial del cliente. Verificado con Grep antes de documentarlo.
  - **CU-A02**: mismo hallazgo de etiqueta en el dashboard admin (menor severidad, `Record<string,string>` no tipado estricto).
  - **CU-A08**: nota sobre la corrección real en `productHasSales()` (ahora también considera ventas particulares, cerrando una inconsistencia con RN-15).
  - **CU-A11**: precisión de redacción en altFlow 6a ("mantiene reclamada" → aclarado que normalmente ya está liberada).
  - **CU-A18**: nota confirmando que el rechazo de canal inválido, ya documentado, ahora sí está implementado en el servidor.
- [x] T12 Validación de datos con `assets/validate.js` de la skill: OK, 89 casos, 4 actores, 26 reglas.
- [x] T13 Diagramas UML y de flujo regenerados con `assets/diagrams.js`/`flowcharts.js` de la skill (paginado automático por actor, ya no agrupación temática manual).
- [x] T14 Documento reconstruido con `assets/build.js` de la skill. Validación XSD: PASSED.
- [x] T15 Entregado como `docs/Casos-de-Uso-RUP-Carrasco-Store-v1.2.docx` (se conservan v1.0 y v1.1 como histórico, sin eliminarlas).

## Nota de alcance
No se modificó ningún archivo de código fuente de la tienda (el hallazgo de CU-C03/CU-A02 queda documentado, no corregido, por estar fuera del alcance autorizado de esta tarea).

## v1.3 — Panel personalizable + fix de confirmacion de cuenta (02/10/2026)
Se agregaron 8 casos de uso nuevos de Administrador (CU-A36 a CU-A43) para el panel de
configuracion personalizable construido en esta sesion (marca, reglas de negocio, moneda,
lineas de negocio activables, contacto y redes, contenido del inicio, textos legales,
plantillas de correo). Se agrego RN-27 y se actualizaron RN-01/RN-03 para reflejar que
IGV y monto minimo ahora son configurables. Se corrigio CU-S04 (correos de cuenta): ya no
describe el mecanismo viejo (enlace que Supabase verifica con un GET), sino el nuevo
(token_hash + verificacion con el SDK desde el cliente, aplicado tambien al correo de
confirmacion de cuenta via la API de administracion de Supabase, no solo en el codigo).

- [x] Dataset actualizado (catalog.json, rules.json, uc-administrador.json,
      uc-sistemas-externos.json) y revalidado: 97 casos, 27 reglas.
- [x] Diagramas UML y de flujo regenerados (Administrador paso de 4 a 5 paginas).
- [x] Documento reconstruido y validado contra XSD: PASSED.
- [x] Entregado como docs/Casos-de-Uso-RUP-Carrasco-Store-v1.3.docx (se conservan v1.0,
      v1.1 y v1.2 como historico).
- Limitacion que se mantiene: los 8 casos nuevos estan marcados Implementado en base a
  typecheck + build + verificacion de la migracion en la base real, no a pruebas manuales
  con clics reales en el formulario (sin credenciales de administrador en esta sesion).
