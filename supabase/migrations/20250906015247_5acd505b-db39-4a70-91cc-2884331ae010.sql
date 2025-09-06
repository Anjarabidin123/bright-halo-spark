-- First, let's ensure the shopping_items table has proper structure
CREATE TABLE IF NOT EXISTS public.shopping_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  quantity INTEGER,
  current_stock INTEGER,
  notes TEXT,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shopping_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for shopping_items
DROP POLICY IF EXISTS "Users can view their own shopping items" ON public.shopping_items;
DROP POLICY IF EXISTS "Users can create shopping items" ON public.shopping_items;
DROP POLICY IF EXISTS "Users can update their own shopping items" ON public.shopping_items;
DROP POLICY IF EXISTS "Users can delete their own shopping items" ON public.shopping_items;

CREATE POLICY "Users can view their own shopping items" 
ON public.shopping_items 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create shopping items" 
ON public.shopping_items 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shopping items" 
ON public.shopping_items 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shopping items" 
ON public.shopping_items 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS update_shopping_items_updated_at ON public.shopping_items;
CREATE TRIGGER update_shopping_items_updated_at
BEFORE UPDATE ON public.shopping_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update the receipts table to use invoice_number as primary ID for display
-- Add index on invoice_number for faster queries
CREATE INDEX IF NOT EXISTS idx_receipts_invoice_number ON public.receipts(invoice_number);

-- Make sure invoice_number is unique within the same date
CREATE UNIQUE INDEX IF NOT EXISTS idx_receipts_invoice_number_unique 
ON public.receipts(invoice_number, DATE(created_at));