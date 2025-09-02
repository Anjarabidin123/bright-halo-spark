-- Reset database and create new authentication system

-- Drop existing data (keep table structure)
TRUNCATE TABLE public.receipt_items CASCADE;
TRUNCATE TABLE public.receipts CASCADE;
TRUNCATE TABLE public.products CASCADE;
TRUNCATE TABLE public.user_roles CASCADE;
TRUNCATE TABLE public.profiles CASCADE;

-- Update profiles table for better authentication support
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS admin_password,
ADD COLUMN IF NOT EXISTS username text UNIQUE,
ADD COLUMN IF NOT EXISTS display_name text,
ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- Create unique index on username
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username) WHERE username IS NOT NULL;

-- Update RLS policies for profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- New RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Update user creation trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, display_name)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', 'User')
  );
  
  -- Assign default kasir role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'kasir');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to get user by username or email
CREATE OR REPLACE FUNCTION public.get_user_by_username_or_email(identifier text)
RETURNS TABLE(user_id uuid, email text, username text, full_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.user_id,
    au.email,
    p.username,
    p.full_name
  FROM public.profiles p
  JOIN auth.users au ON p.user_id = au.id
  WHERE p.username = identifier OR au.email = identifier;
END;
$$;