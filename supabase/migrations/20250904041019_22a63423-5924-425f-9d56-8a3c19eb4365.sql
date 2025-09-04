-- Update the invoice number generation function to use the requested format
CREATE OR REPLACE FUNCTION public.generate_invoice_number_v2(is_manual boolean DEFAULT false, tx_date date DEFAULT CURRENT_DATE)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  prefix text := CASE WHEN is_manual THEN 'MNL' ELSE 'inv' END;
  date_str text := to_char(tx_date, 'DDMMYY');
  seq int;
  result text;
BEGIN
  SELECT COUNT(*) + 1 INTO seq
  FROM public.receipts r
  WHERE DATE(r.created_at) = tx_date
    AND (
      CASE 
        WHEN is_manual THEN r.invoice_number ILIKE 'MNL-%'
        ELSE r.invoice_number ILIKE 'inv-%'
      END
    );

  result := prefix || '-' || seq::text || date_str;
  RETURN result;
END;
$$;

-- Enable realtime for all POS tables
ALTER TABLE public.products REPLICA IDENTITY FULL;
ALTER TABLE public.receipts REPLICA IDENTITY FULL;
ALTER TABLE public.receipt_items REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.receipts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.receipt_items;