-- Migration: 20261014_add_midtrans_payment_fields
-- Description: Add additive Midtrans payment fields and indexes to order_rooms, rental_bookings, and promotions.
-- Safety: Fully additive (IF NOT EXISTS), non-destructive, preserves all existing Tripay/Xendit legacy columns and historic data.

-- 1. order_rooms
ALTER TABLE "order_rooms" ADD COLUMN IF NOT EXISTS "midtrans_order_id" VARCHAR(255);
ALTER TABLE "order_rooms" ADD COLUMN IF NOT EXISTS "midtrans_transaction_id" VARCHAR(255);
ALTER TABLE "order_rooms" ADD COLUMN IF NOT EXISTS "midtrans_snap_token" TEXT;
ALTER TABLE "order_rooms" ADD COLUMN IF NOT EXISTS "payment_status" VARCHAR(50) DEFAULT 'UNPAID';
ALTER TABLE "order_rooms" ADD COLUMN IF NOT EXISTS "payment_method_type" VARCHAR(50);
ALTER TABLE "order_rooms" ADD COLUMN IF NOT EXISTS "paid_at" TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS "uq_order_rooms_midtrans_order_id" 
ON "order_rooms" ("midtrans_order_id") 
WHERE "midtrans_order_id" IS NOT NULL;

-- 2. rental_bookings
ALTER TABLE "rental_bookings" ADD COLUMN IF NOT EXISTS "midtrans_order_id" VARCHAR(255);
ALTER TABLE "rental_bookings" ADD COLUMN IF NOT EXISTS "midtrans_transaction_id" VARCHAR(255);
ALTER TABLE "rental_bookings" ADD COLUMN IF NOT EXISTS "midtrans_snap_token" TEXT;
ALTER TABLE "rental_bookings" ADD COLUMN IF NOT EXISTS "payment_status" VARCHAR(50) DEFAULT 'UNPAID';
ALTER TABLE "rental_bookings" ADD COLUMN IF NOT EXISTS "payment_method_type" VARCHAR(50);
ALTER TABLE "rental_bookings" ADD COLUMN IF NOT EXISTS "paid_at" TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS "uq_rental_bookings_midtrans_order_id" 
ON "rental_bookings" ("midtrans_order_id") 
WHERE "midtrans_order_id" IS NOT NULL;

-- 3. promotions
ALTER TABLE "promotions" ADD COLUMN IF NOT EXISTS "midtrans_order_id" VARCHAR(255);
ALTER TABLE "promotions" ADD COLUMN IF NOT EXISTS "midtrans_transaction_id" VARCHAR(255);
ALTER TABLE "promotions" ADD COLUMN IF NOT EXISTS "midtrans_snap_token" TEXT;
ALTER TABLE "promotions" ADD COLUMN IF NOT EXISTS "payment_status" VARCHAR(50) DEFAULT 'UNPAID';
ALTER TABLE "promotions" ADD COLUMN IF NOT EXISTS "paid_at" TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS "uq_promotions_midtrans_order_id" 
ON "promotions" ("midtrans_order_id") 
WHERE "midtrans_order_id" IS NOT NULL;
