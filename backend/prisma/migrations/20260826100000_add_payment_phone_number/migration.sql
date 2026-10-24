BEGIN;

ALTER TABLE public.payment_transactions
ADD COLUMN IF NOT EXISTS "phoneNumber" TEXT;

COMMIT;