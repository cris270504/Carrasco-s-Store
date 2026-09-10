-- Configuracion editable desde /admin/configuracion: numero del boton
-- flotante de WhatsApp y contador de ofertas del home.
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "whatsapp_number" varchar(30);
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "whatsapp_cta" varchar(200);
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "offer_countdown_ends_at" timestamptz;
-- Por si la columna ya existia como timestamp sin tz.
ALTER TABLE "store_settings" ALTER COLUMN "offer_countdown_ends_at" TYPE timestamptz;
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "offer_countdown_title" varchar(120);
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "offer_countdown_url" varchar(255);
