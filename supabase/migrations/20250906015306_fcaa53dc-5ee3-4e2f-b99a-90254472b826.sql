-- Update the receipts table to use invoice_number as primary ID for display
-- Add index on invoice_number for faster queries
CREATE INDEX IF NOT EXISTS idx_receipts_invoice_number ON public.receipts(invoice_number);

-- Make sure invoice_number is unique (no date function in unique constraint)
DROP INDEX IF EXISTS idx_receipts_invoice_number_unique;
CREATE UNIQUE INDEX IF NOT EXISTS idx_receipts_invoice_number_unique 
ON public.receipts(invoice_number);