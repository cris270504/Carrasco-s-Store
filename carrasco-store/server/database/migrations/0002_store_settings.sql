CREATE TABLE IF NOT EXISTS "store_settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"shipping_flat_rate" numeric(10, 2) DEFAULT '15' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
ALTER TABLE "store_settings" ENABLE ROW LEVEL SECURITY;
