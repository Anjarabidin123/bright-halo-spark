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
    // Find email by username
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email')
      .eq('username', username)
      .maybeSingle();

    if (profileError || !profile?.email) {
      return { error: { message: 'Username tidak ditemukan' } };
    }

    return signIn(profile.email, password);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const verifyAdminPassword = async (password: string): Promise<boolean> => {
    // Simplified to use the same constant as AdminProtection to avoid DB dependency
    return password === '122344566';
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