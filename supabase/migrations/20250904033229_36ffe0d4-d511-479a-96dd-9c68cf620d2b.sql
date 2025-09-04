-- Fix the generate_invoice_number function to handle empty transactions table
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  next_number INTEGER;
  invoice_num TEXT;
BEGIN
  -- Get the next sequence number from receipts table instead of transactions
  SELECT COALESCE(
    (SELECT CAST(SUBSTRING(invoice_number FROM 5) AS INTEGER) + 1
     FROM public.receipts 
     WHERE invoice_number ~ '^INV-[0-9]+$'
     ORDER BY CAST(SUBSTRING(invoice_number FROM 5) AS INTEGER) DESC 
     LIMIT 1), 
    1
  ) INTO next_number;
  
  -- Format as INV-000001
  invoice_num := 'INV-' || LPAD(next_number::TEXT, 6, '0');
  
  RETURN invoice_num;
END;
$function$