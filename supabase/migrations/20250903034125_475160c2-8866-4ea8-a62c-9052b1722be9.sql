-- Fix security vulnerability: Restrict shopping items access to item owners only
-- Currently all authenticated users can view, update, and delete anyone's shopping items

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "All users can view shopping items" ON public.shopping_items;
DROP POLICY IF EXISTS "Users can update shopping items" ON public.shopping_items;  
DROP POLICY IF EXISTS "Users can delete shopping items" ON public.shopping_items;

-- Create secure policies that only allow users to access their own shopping items
CREATE POLICY "Users can view their own shopping items" 
ON public.shopping_items 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own shopping items" 
ON public.shopping_items 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shopping items" 
ON public.shopping_items 
FOR DELETE 
USING (auth.uid() = user_id);

-- The INSERT policy "Users can create shopping items" is already secure with:
-- WITH CHECK (auth.uid() = user_id)
-- So we don't need to modify it