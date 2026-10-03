-- Paso (ancho de cada tramo) de las casillas de precio del catalogo, configurable
-- desde /admin/configuracion. Por defecto tramos de S/ 25.
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "catalog_price_step" numeric(10, 2) NOT NULL DEFAULT '25';
