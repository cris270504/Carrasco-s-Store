-- Rango del slider de precio del catalogo, configurable desde /admin/configuracion
-- (antes un tope fijo de 5000 en ProductFilters.vue). No es un limite real de
-- cuanto puede costar un producto, solo los extremos del control del filtro.
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "catalog_min_price" numeric(10, 2) NOT NULL DEFAULT '0';
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "catalog_max_price" numeric(10, 2) NOT NULL DEFAULT '2000';
