-- Panel personalizable: campos nuevos para que el admin configure marca,
-- reglas de negocio, lineas activas, contacto/redes, contenido del inicio y
-- textos legales sin tocar codigo. Mismo patron que 0002/0007: columnas
-- nuevas en la fila unica store_settings, todas con default seguro.
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "store_name" varchar(80) NOT NULL DEFAULT 'Carrasco Store';
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "logo_url" varchar(500);
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "favicon_url" varchar(500);

ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "igv_rate" numeric(5, 4) NOT NULL DEFAULT '0.1800';
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "low_stock_threshold" integer NOT NULL DEFAULT 5;
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "mp_min_amount" numeric(10, 2) NOT NULL DEFAULT '10';
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "currency_code" varchar(3) NOT NULL DEFAULT 'PEN';

-- Solo ocultan del catalogo/inicio; no bloquean ni borran productos existentes.
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "physical_enabled" boolean NOT NULL DEFAULT true;
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "digital_enabled" boolean NOT NULL DEFAULT true;
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "service_enabled" boolean NOT NULL DEFAULT true;

ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "owner_whatsapp_numbers" varchar(255);
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "sender_email" varchar(200);
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "facebook_url" varchar(255);
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "instagram_url" varchar(255);
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "tiktok_url" varchar(255);

ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "home_hero_badge" varchar(120);
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "home_hero_title" varchar(200);
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "home_hero_subtitle" varchar(400);
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "home_trust_badges" jsonb;

ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "legal_terms_sections" jsonb;
ALTER TABLE "store_settings" ADD COLUMN IF NOT EXISTS "legal_privacy_sections" jsonb;

-- Plantillas de correo (solo los 2 correos 100% lineales; ver schema.ts).
CREATE TABLE IF NOT EXISTS "message_templates" (
  "key" varchar(60) PRIMARY KEY,
  "subject" varchar(200) NOT NULL,
  "body" text NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
ALTER TABLE "message_templates" ENABLE ROW LEVEL SECURITY;
