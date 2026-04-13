-- Add transactionId field to Payment table to store Midtrans transaction ID
ALTER TABLE "payments" ADD COLUMN "transaction_id" TEXT UNIQUE;

-- Create index for faster lookup by transaction_id
CREATE INDEX "payments_transaction_id_idx" ON "payments"("transaction_id");
