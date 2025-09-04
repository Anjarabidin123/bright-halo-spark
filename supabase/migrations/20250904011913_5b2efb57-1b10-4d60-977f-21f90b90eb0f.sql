-- New invoice number format per request: inv-[sequence][ddmmyy] and MNL-[sequence][ddmmyy]
-- Create function to generate numbers per day and per type
CREATE OR REPLACE FUNCTION public.generate_invoice_number_v2(is_manual boolean, tx_date date DEFAULT CURRENT_DATE)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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