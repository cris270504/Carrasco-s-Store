-- Proveedores, costos de adquisicion, snapshot de costo por venta y ventas
-- particulares (fuera de la tienda). Alimentan el dashboard de finanzas.

CREATE TABLE IF NOT EXISTS "suppliers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(160) NOT NULL UNIQUE,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
ALTER TABLE "suppliers" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "cost_price" numeric(10, 2);
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "supplier_id" uuid REFERENCES "suppliers"("id");
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "cost_updated_at" timestamp;

ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "unit_cost" numeric(10, 2);

ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "buyer_phone" varchar(30);

DO $$ BEGIN
	CREATE TYPE "manual_sale_channel" AS ENUM ('whatsapp', 'presencial', 'redes', 'otro');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "manual_sales" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid REFERENCES "products"("id"),
	"description" varchar(255) NOT NULL,
	"supplier_id" uuid REFERENCES "suppliers"("id"),
	"customer_name" varchar(200),
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"unit_cost" numeric(10, 2) DEFAULT '0' NOT NULL,
	"channel" "manual_sale_channel" DEFAULT 'whatsapp' NOT NULL,
	"notes" text,
	"sold_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
ALTER TABLE "manual_sales" ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS "manual_sales_sold_at_idx" ON "manual_sales" USING btree ("sold_at");
CREATE INDEX IF NOT EXISTS "manual_sales_product_idx" ON "manual_sales" USING btree ("product_id");
