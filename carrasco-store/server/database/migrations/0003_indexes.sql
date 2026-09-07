-- Indices en columnas de alto trafico que no los tenian: carrito, items de
-- orden y licencias digitales se consultan por estas columnas en
-- practicamente cada request de carrito/checkout/fulfillment.
CREATE INDEX IF NOT EXISTS "digital_licenses_product_status_idx" ON "digital_licenses" USING btree ("product_id", "status");
CREATE INDEX IF NOT EXISTS "addresses_user_idx" ON "addresses" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "carts_user_idx" ON "carts" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "carts_session_idx" ON "carts" USING btree ("session_id");
CREATE INDEX IF NOT EXISTS "cart_items_cart_idx" ON "cart_items" USING btree ("cart_id");
CREATE INDEX IF NOT EXISTS "cart_items_product_idx" ON "cart_items" USING btree ("product_id");
CREATE INDEX IF NOT EXISTS "order_items_order_idx" ON "order_items" USING btree ("order_id");
CREATE INDEX IF NOT EXISTS "order_items_product_idx" ON "order_items" USING btree ("product_id");
