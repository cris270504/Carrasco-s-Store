CREATE TABLE IF NOT EXISTS "favorites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_product_id_products_id_fk"
	FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
CREATE UNIQUE INDEX "favorites_user_product_unique" ON "favorites" USING btree ("user_id", "product_id");
CREATE INDEX "favorites_user_idx" ON "favorites" USING btree ("user_id");
ALTER TABLE "favorites" ENABLE ROW LEVEL SECURITY;
