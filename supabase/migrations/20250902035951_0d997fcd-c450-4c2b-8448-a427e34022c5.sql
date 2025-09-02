-- Create the default user account for Toko Anjar
-- First, manually insert the user into auth.users (this should be done through Supabase Auth API instead)
-- Since we can't directly insert into auth.users, we'll just ensure the profile exists when they sign up

-- But for now, let's ensure the profile will be created properly
-- The auth trigger will handle this automatically when they sign up
-- We just need to make sure the email confirmation works properly

-- Let's add any missing configurations we might need
-- No changes needed to existing tables