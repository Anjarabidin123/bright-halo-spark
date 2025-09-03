-- Create shopping_items table for collaborative shopping lists
CREATE TABLE public.shopping_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  quantity INTEGER,
  unit TEXT DEFAULT 'pcs',
  current_stock INTEGER,
  notes TEXT,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.shopping_items ENABLE ROW LEVEL SECURITY;

-- Create policies for shopping items - allow all authenticated users to see all items (collaborative)
CREATE POLICY "All users can view shopping items" 
ON public.shopping_items 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create shopping items" 
ON public.shopping_items 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update shopping items" 
ON public.shopping_items 
FOR UPDATE 
USING (true);

CREATE POLICY "Users can delete shopping items" 
ON public.shopping_items 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_shopping_items_updated_at
BEFORE UPDATE ON public.shopping_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER TABLE public.shopping_items REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shopping_items;