-- Habilita Row Level Security en todas las tablas de la app.
-- El backend accede via DATABASE_URL con el rol propietario de las tablas
-- (bypassea RLS por defecto en Postgres) usando Drizzle; el objetivo de esto
-- es bloquear el acceso directo via la API REST de Supabase (PostgREST) con
-- la anon key expuesta en el cliente, ya que ninguna tabla debe consultarse
-- desde el frontend (solo Supabase Auth se usa client-side).
-- Sin policies definidas: RLS habilitado + cero policies = acceso denegado
-- por defecto para los roles anon/authenticated de PostgREST.
ALTER TABLE "categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "products" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "product_variants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "digital_licenses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "service_details" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "addresses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "carts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cart_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "order_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "service_bookings" ENABLE ROW LEVEL SECURITY;
