-- Migracion a Checkout API via Orders (/v1/orders) en lugar de Checkout Pro.
-- El recurso de pago ahora es una "Order" de Mercado Pago con id propio
-- (ej. "ORD01..."), distinta del par preference + payment de Checkout Pro.
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "mp_order_id" varchar(100);

-- Evidencia de posibles cobros duplicados: si llega una segunda confirmacion
-- de pago (id de pago distinto) para una orden que ya no admite cobro, se
-- registra aca para revision manual en vez de descartarla en silencio.
CREATE TABLE IF NOT EXISTS "payment_review_flags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
	"mp_order_id" varchar(100),
	"mp_payment_id" varchar(100),
	"reason" text NOT NULL,
	"resolved" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
ALTER TABLE "payment_review_flags" ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS "payment_review_flags_order_idx" ON "payment_review_flags" USING btree ("order_id");
