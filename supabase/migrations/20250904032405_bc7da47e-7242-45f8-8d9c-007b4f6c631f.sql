-- Clean up existing users and profiles
DELETE FROM public.profiles WHERE user_id IN (SELECT id FROM auth.users);
DELETE FROM public.user_roles WHERE user_id IN (SELECT id FROM auth.users);