
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, fullName: string) => Promise<any>;
  signOut: () => Promise<any>;
  resetPassword: (email: string) => Promise<any>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    let authSubscription: any = null;

    const initializeAuth = async () => {
      try {
        setError(null);
        setLoading(true);
        
        // Set up auth state listener (synchronous callback per best practices)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, nextSession) => {
            try {
              if (!mounted) return;

              console.log('Auth state changed:', event, nextSession?.user?.email);

              switch (event) {
                case 'INITIAL_SESSION':
                case 'SIGNED_IN':
                case 'TOKEN_REFRESHED':
                case 'USER_UPDATED':
                  setSession(nextSession);
                  setUser(nextSession?.user ?? null);
                  setError(null);
                  setRetryCount(0);
                  break;
                case 'SIGNED_OUT':
                  setSession(null);
                  setUser(null);
                  setError(null);
                  break;
              }
              // Do NOT set loading here to avoid race conditions; we'll finalize after initial getSession
            } catch (err) {
              console.error('Auth state change error:', err);
              if (mounted) {
                setError(err instanceof Error ? err.message : 'Authentication state error');
              }
            }
          }
        );

        authSubscription = subscription;

        // Check for existing session with enhanced retry mechanism
        const getSessionWithRetry = async (attempts = 3): Promise<any> => {
          for (let i = 0; i < attempts; i++) {
            try {
              const { data: { session }, error } = await supabase.auth.getSession();
              if (error) throw error;
              return session;
            } catch (err) {
              console.error(`Session attempt ${i + 1}/${attempts}:`, err);
              if (i === attempts - 1) throw err;
              await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
            }
          }
        };

        const session = await getSessionWithRetry();
        
        if (mounted) {
          console.log('Initial session check:', session?.user?.email);
          setSession(session);
          setUser(session?.user ?? null);
          setError(null);
          setRetryCount(0);
          setLoading(false);
        }

      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setError(error instanceof Error ? error.message : 'Authentication failed');
          setLoading(false);
          
          // Retry initialization with exponential backoff
          if (retryCount < 3) {
            setTimeout(() => {
              if (mounted) {
                setRetryCount(prev => prev + 1);
              }
            }, 2000 * Math.pow(2, retryCount));
          }
        }
      }
    };

    initializeAuth();
    
    return () => {
      mounted = false;
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, [retryCount]);

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      console.log('Attempting to sign in:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        setError(error.message);
        toast({
          title: "Sign in failed",
          description: error.message,
          variant: "destructive",
        });
      }
      
      console.log('Sign in result:', { data: data?.user?.email, error: error?.message });
      return { data, error };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      toast({
        title: "Sign in failed",
        description: errorMessage,
        variant: "destructive",
      });
      return { data: null, error: { message: errorMessage } };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      setError(null);
      setLoading(true);
      console.log('Attempting to sign up:', email);
      
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
          },
        },
      });
      
      if (error) {
        setError(error.message);
        toast({
          title: "Sign up failed",
          description: error.message,
          variant: "destructive",
        });
      }
      
      console.log('Sign up result:', { data: data?.user?.email, error: error?.message });
      return { data, error };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      toast({
        title: "Sign up failed",
        description: errorMessage,
        variant: "destructive",
      });
      return { data: null, error: { message: errorMessage } };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    const redirectUrl = `${window.location.origin}/reset-password`;
    
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });
    return { data, error };
  };

  const signOut = async () => {
    try {
      setError(null);
      console.log('Signing out');
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        setError(error.message);
        toast({
          title: "Sign out failed",
          description: error.message,
          variant: "destructive",
        });
      }
      
      return { error };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      return { error: { message: errorMessage } };
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value = {
    user,
    session,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    resetPassword,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
