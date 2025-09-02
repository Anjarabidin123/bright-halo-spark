import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<{ error?: any }>;
  signInWithUsername: (username: string, password: string) => Promise<{ error?: any }>;
  signUp: (email: string, username: string, password: string) => Promise<{ error?: any }>;
  signOut: () => Promise<void>;
  verifyAdminPassword: (password: string) => Promise<boolean>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, username: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          username: username
        }
      }
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signInWithUsername = async (username: string, password: string) => {
    // Check for hardcoded credentials first
    if (username === 'tokoanjar' && password === 'anjarfc') {
      // Use the correct email address
      const email = 'tokoanjar036@gmail.com';
      
      // Try to sign in first
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      // If sign in failed because user doesn't exist, create the user
      if (signInError && signInError.message.includes('Invalid login credentials')) {
        // Create the user with email confirmation disabled for this specific user
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              username: username,
              email_confirm: true // Skip email confirmation
            }
          }
        });
        
        if (signUpError) {
          return { error: signUpError };
        }
        
        // If signup was successful, try to sign in immediately
        if (signUpData.user && !signUpData.user.email_confirmed_at) {
          // For development/testing, we'll proceed even without email confirmation
          // In production, you'd want proper email confirmation
          return await supabase.auth.signInWithPassword({
            email,
            password,
          });
        }
        
        return { data: signUpData, error: null };
      }
      
      return { data: signInData, error: signInError };
    }

    // Get user by username for other users
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('email')
      .eq('username', username)
      .single();

    if (profileError || !profiles) {
      return { error: { message: 'Username tidak ditemukan' } };
    }

    return signIn(profiles.email, password);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const verifyAdminPassword = async (password: string): Promise<boolean> => {
    if (!user) return false;
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('admin_password')
      .eq('user_id', user.id)
      .single();

    return profile?.admin_password === password;
  };

  const value = {
    user,
    session,
    signIn,
    signInWithUsername,
    signUp,
    signOut,
    verifyAdminPassword,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};