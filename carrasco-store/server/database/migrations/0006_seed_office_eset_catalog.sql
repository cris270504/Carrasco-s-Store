-- Carga inicial del catalogo de licencias Microsoft Office + antivirus ESET,
-- con precio de venta, costo de adquisicion y proveedor (datos del cliente,
-- actualizados a setiembre 2026).
--
-- Los productos NUEVOS se insertan INACTIVOS: no tienen codigos de licencia
-- cargados todavia y una compra sin stock de licencias no se puede entregar.
-- El admin debe cargar los codigos en /admin/productos y recien ahi activarlos.
-- "Microsoft Office 2024" ya existia con codigos, se mantiene activo.

INSERT INTO "suppliers" ("name", "notes") VALUES
	('Software Perú Licencias', 'Licencias Microsoft Office / Microsoft 365. Datos actualizados set. 2026.'),
	('Soluciones MK', 'Licencias antivirus ESET.')
ON CONFLICT ("name") DO NOTHING;

-- Producto existente: se ajusta a la lista nueva (S/129 -> S/75).
UPDATE "products" SET
	"name" = 'Microsoft Office 2024',
	"slug" = 'microsoft-office-2024',
	"description" = 'Licencia perpetua (pago único, sin suscripción). Incluye Word, Excel, PowerPoint y más. Se entrega la clave por correo con instrucciones de activación.',
	"brand" = 'Microsoft',
	"price" = '75.00',
	"cost_price" = '49.00',
	"supplier_id" = (SELECT "id" FROM "suppliers" WHERE "name" = 'Software Perú Licencias'),
	"cost_updated_at" = TIMESTAMP '2026-09-01'
WHERE "slug" = 'office-2024-hogar-estudiantes';

INSERT INTO "products"
	("name", "slug", "description", "brand", "price", "cost_price", "supplier_id", "cost_updated_at", "type", "stock", "requires_shipping", "category_id", "is_active")
VALUES
	(
		'Microsoft 365 (1 año)',
		'microsoft-365-1-ano',
		'Suscripción por 1 año. Incluye Word, Excel, PowerPoint y más. Válido para usarlo hasta en 5 dispositivos (se activa y se explica la instalación del primero).',
		'Microsoft', '80.00', '45.00',
		(SELECT "id" FROM "suppliers" WHERE "name" = 'Software Perú Licencias'), TIMESTAMP '2026-09-01',
		'digital', NULL, false,
		(SELECT "id" FROM "categories" WHERE "slug" = 'software-licencias'), false
	),
	(
		'Microsoft Office 2021',
		'microsoft-office-2021',
		'Licencia perpetua (pago único, sin suscripción). Incluye Word, Excel, PowerPoint y más.',
		'Microsoft', '70.00', '53.00',
		(SELECT "id" FROM "suppliers" WHERE "name" = 'Software Perú Licencias'), TIMESTAMP '2026-09-01',
		'digital', NULL, false,
		(SELECT "id" FROM "categories" WHERE "slug" = 'software-licencias'), false
	),
	(
		'Microsoft Office 2019',
		'microsoft-office-2019',
		'Licencia perpetua (pago único, sin suscripción). Incluye Word, Excel, PowerPoint y más.',
		'Microsoft', '60.00', '34.00',
		(SELECT "id" FROM "suppliers" WHERE "name" = 'Software Perú Licencias'), TIMESTAMP '2026-09-01',
		'digital', NULL, false,
		(SELECT "id" FROM "categories" WHERE "slug" = 'software-licencias'), false
	),
	(
		'Microsoft Office 2016',
		'microsoft-office-2016',
		'Licencia perpetua (pago único, sin suscripción). Incluye Word, Excel, PowerPoint y más.',
		'Microsoft', '55.00', '32.00',
		(SELECT "id" FROM "suppliers" WHERE "name" = 'Software Perú Licencias'), TIMESTAMP '2026-09-01',
		'digital', NULL, false,
		(SELECT "id" FROM "categories" WHERE "slug" = 'software-licencias'), false
	),
	(
		'Antivirus ESET Internet Security (1 año)',
		'eset-internet-security-1-ano',
		'Licencia original por 1 año. Incluye instalación remota y asistencia técnica por medio año ante consultas relacionadas al antivirus instalado.',
		'ESET', '70.00', '37.00',
		(SELECT "id" FROM "suppliers" WHERE "name" = 'Soluciones MK'), TIMESTAMP '2026-09-01',
		'digital', NULL, false,
		(SELECT "id" FROM "categories" WHERE "slug" = 'software-licencias'), false
	)
ON CONFLICT ("slug") DO NOTHING;
