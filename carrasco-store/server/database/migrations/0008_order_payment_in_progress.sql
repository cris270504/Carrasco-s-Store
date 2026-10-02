-- Nuevo estado para reclamar atomicamente una orden antes de llamar a la
-- Orders API de Mercado Pago (evita doble cobro por condicion de carrera en
-- server/api/checkout/confirm.post.ts).
ALTER TYPE "order_status" ADD VALUE IF NOT EXISTS 'payment_in_progress';
