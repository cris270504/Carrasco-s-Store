-- ============================================================
-- Carrasco Store — Políticas de Row Level Security (RLS)
-- ============================================================
-- Contexto: el backend Nitro (server/utils/db.ts) se conecta a Postgres
-- directamente vía DATABASE_URL (rol con privilegios de servicio), por lo
-- que estas políticas NO afectan a los endpoints de server/api/**. Su
-- función es proteger los datos ante cualquier acceso directo a la base
-- (Supabase Studio con rol anon/authenticated, PostgREST, service keys mal
-- configuradas, etc.), como defensa en profundidad.
--
-- Ejecutar completo en el SQL Editor de Supabase.
-- ============================================================

-- ------------------------------------------------------------
-- Helper: identifica al usuario admin por email (JWT de Supabase Auth)
-- Mantener sincronizado con ADMIN_EMAILS en .env
-- ------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select lower(coalesce(auth.jwt() ->> 'email', '')) = any (array[
    'technologycarrascocrisanto@gmail.com'
  ]);
$$;

-- ============================================================
-- 1. CATÁLOGO — lectura pública, escritura solo admin
-- ============================================================

-- categories
alter table public.categories enable row level security;

drop policy if exists "categories_public_select" on public.categories;
create policy "categories_public_select" on public.categories
  for select using (true);

drop policy if exists "categories_admin_write" on public.categories;
create policy "categories_admin_write" on public.categories
  for all using (is_admin()) with check (is_admin());

-- products
alter table public.products enable row level security;

drop policy if exists "products_public_select" on public.products;
create policy "products_public_select" on public.products
  for select using (true);

drop policy if exists "products_admin_write" on public.products;
create policy "products_admin_write" on public.products
  for all using (is_admin()) with check (is_admin());

-- product_variants
alter table public.product_variants enable row level security;

drop policy if exists "product_variants_public_select" on public.product_variants;
create policy "product_variants_public_select" on public.product_variants
  for select using (true);

drop policy if exists "product_variants_admin_write" on public.product_variants;
create policy "product_variants_admin_write" on public.product_variants
  for all using (is_admin()) with check (is_admin());

-- service_details
alter table public.service_details enable row level security;

drop policy if exists "service_details_public_select" on public.service_details;
create policy "service_details_public_select" on public.service_details
  for select using (true);

drop policy if exists "service_details_admin_write" on public.service_details;
create policy "service_details_admin_write" on public.service_details
  for all using (is_admin()) with check (is_admin());

-- store_settings: configuración global (ej. costo de envío), lectura pública
alter table public.store_settings enable row level security;

drop policy if exists "store_settings_public_select" on public.store_settings;
create policy "store_settings_public_select" on public.store_settings
  for select using (true);

drop policy if exists "store_settings_admin_write" on public.store_settings;
create policy "store_settings_admin_write" on public.store_settings
  for all using (is_admin()) with check (is_admin());

-- digital_licenses: contienen códigos sensibles, NUNCA lectura pública
alter table public.digital_licenses enable row level security;

drop policy if exists "digital_licenses_admin_only" on public.digital_licenses;
create policy "digital_licenses_admin_only" on public.digital_licenses
  for all using (is_admin()) with check (is_admin());

-- ============================================================
-- 2. USUARIOS Y DIRECCIONES — el cliente solo ve/crea lo suyo
-- ============================================================

-- addresses
alter table public.addresses enable row level security;

drop policy if exists "addresses_owner_select" on public.addresses;
create policy "addresses_owner_select" on public.addresses
  for select using (user_id = auth.uid() or is_admin());

drop policy if exists "addresses_owner_insert" on public.addresses;
create policy "addresses_owner_insert" on public.addresses
  for insert with check (user_id = auth.uid());

drop policy if exists "addresses_owner_update" on public.addresses;
create policy "addresses_owner_update" on public.addresses
  for update using (user_id = auth.uid() or is_admin()) with check (user_id = auth.uid() or is_admin());

drop policy if exists "addresses_owner_delete" on public.addresses;
create policy "addresses_owner_delete" on public.addresses
  for delete using (user_id = auth.uid() or is_admin());

-- ============================================================
-- 3. CARRITO — el cliente solo ve/crea su propio carrito
-- ============================================================

-- carts
alter table public.carts enable row level security;

drop policy if exists "carts_owner_select" on public.carts;
create policy "carts_owner_select" on public.carts
  for select using (user_id = auth.uid() or is_admin());

drop policy if exists "carts_owner_insert" on public.carts;
create policy "carts_owner_insert" on public.carts
  for insert with check (user_id = auth.uid());

drop policy if exists "carts_owner_update" on public.carts;
create policy "carts_owner_update" on public.carts
  for update using (user_id = auth.uid() or is_admin()) with check (user_id = auth.uid() or is_admin());

drop policy if exists "carts_owner_delete" on public.carts;
create policy "carts_owner_delete" on public.carts
  for delete using (user_id = auth.uid() or is_admin());

-- cart_items (dueño vía carts.user_id)
alter table public.cart_items enable row level security;

drop policy if exists "cart_items_owner_select" on public.cart_items;
create policy "cart_items_owner_select" on public.cart_items
  for select using (
    is_admin() or exists (
      select 1 from public.carts c where c.id = cart_items.cart_id and c.user_id = auth.uid()
    )
  );

drop policy if exists "cart_items_owner_insert" on public.cart_items;
create policy "cart_items_owner_insert" on public.cart_items
  for insert with check (
    exists (select 1 from public.carts c where c.id = cart_items.cart_id and c.user_id = auth.uid())
  );

drop policy if exists "cart_items_owner_update" on public.cart_items;
create policy "cart_items_owner_update" on public.cart_items
  for update using (
    is_admin() or exists (select 1 from public.carts c where c.id = cart_items.cart_id and c.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.carts c where c.id = cart_items.cart_id and c.user_id = auth.uid())
  );

drop policy if exists "cart_items_owner_delete" on public.cart_items;
create policy "cart_items_owner_delete" on public.cart_items
  for delete using (
    is_admin() or exists (select 1 from public.carts c where c.id = cart_items.cart_id and c.user_id = auth.uid())
  );

-- ============================================================
-- 4. ÓRDENES — el cliente lee/crea las suyas; modificarlas es solo admin
-- ============================================================

-- orders
alter table public.orders enable row level security;

drop policy if exists "orders_owner_select" on public.orders;
create policy "orders_owner_select" on public.orders
  for select using (user_id = auth.uid() or is_admin());

drop policy if exists "orders_owner_insert" on public.orders;
create policy "orders_owner_insert" on public.orders
  for insert with check (user_id = auth.uid());

drop policy if exists "orders_admin_update" on public.orders;
create policy "orders_admin_update" on public.orders
  for update using (is_admin()) with check (is_admin());

drop policy if exists "orders_admin_delete" on public.orders;
create policy "orders_admin_delete" on public.orders
  for delete using (is_admin());

-- order_items (dueño vía orders.user_id)
alter table public.order_items enable row level security;

drop policy if exists "order_items_owner_select" on public.order_items;
create policy "order_items_owner_select" on public.order_items
  for select using (
    is_admin() or exists (
      select 1 from public.orders o where o.id = order_items.order_id and o.user_id = auth.uid()
    )
  );

drop policy if exists "order_items_owner_insert" on public.order_items;
create policy "order_items_owner_insert" on public.order_items
  for insert with check (
    exists (select 1 from public.orders o where o.id = order_items.order_id and o.user_id = auth.uid())
  );

drop policy if exists "order_items_admin_update" on public.order_items;
create policy "order_items_admin_update" on public.order_items
  for update using (is_admin()) with check (is_admin());

drop policy if exists "order_items_admin_delete" on public.order_items;
create policy "order_items_admin_delete" on public.order_items
  for delete using (is_admin());

-- service_bookings
alter table public.service_bookings enable row level security;

drop policy if exists "service_bookings_owner_select" on public.service_bookings;
create policy "service_bookings_owner_select" on public.service_bookings
  for select using (user_id = auth.uid() or is_admin());

drop policy if exists "service_bookings_owner_insert" on public.service_bookings;
create policy "service_bookings_owner_insert" on public.service_bookings
  for insert with check (user_id = auth.uid());

drop policy if exists "service_bookings_admin_update" on public.service_bookings;
create policy "service_bookings_admin_update" on public.service_bookings
  for update using (is_admin()) with check (is_admin());

drop policy if exists "service_bookings_admin_delete" on public.service_bookings;
create policy "service_bookings_admin_delete" on public.service_bookings
  for delete using (is_admin());

-- ============================================================
-- 5. FAVORITOS — el cliente solo ve/crea/borra los suyos
-- ============================================================

alter table public.favorites enable row level security;

drop policy if exists "favorites_owner_select" on public.favorites;
create policy "favorites_owner_select" on public.favorites
  for select using (user_id = auth.uid() or is_admin());

drop policy if exists "favorites_owner_insert" on public.favorites;
create policy "favorites_owner_insert" on public.favorites
  for insert with check (user_id = auth.uid());

drop policy if exists "favorites_owner_delete" on public.favorites;
create policy "favorites_owner_delete" on public.favorites
  for delete using (user_id = auth.uid() or is_admin());
