'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  team_id?: string;
  role?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ needsEmailVerification: boolean }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  checkEmailVerification: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = createClientComponentClient();
  const router = useRouter();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  /************ helpers ************/
  const fetchProfile = async () => {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error || !session) {
        setUser(null);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      setUser({
        id: session.user.id,
        email: session.user.email!,
        full_name: profile?.full_name,
        team_id: profile?.team_id,
        role: profile?.role,
      });
    } catch (e) {
      console.error('fetchProfile error:', e);
    } finally {
      setLoading(false);
    }
  };

  /************ actions ************/
  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      await fetchProfile();
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string = ''
  ) => {
    setLoading(true);
    try {
      console.log('Starting signup process for:', email);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: fullName
          }
        }
      });
      
      if (error) {
        console.error('Signup error:', error);
        throw error;
      }
      
      if (!data.user) {
        console.error('No user data returned');
        throw new Error('Could not obtain new user id');
      }

      console.log('Signup successful, checking verification status');
      
      // Check if email verification is required
      const needsEmailVerification = !data.session;
      console.log('Needs email verification:', needsEmailVerification);

      if (!needsEmailVerification) {
        console.log('No verification needed, proceeding with profile setup');
        let retries = 0;
        let session = null;
        
        while (retries < 5) {
          const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
          if (sessionError) {
            console.error('Session error:', sessionError);
            throw sessionError;
          }
          if (currentSession) {
            session = currentSession;
            break;
          }
          console.log('Waiting for session, attempt:', retries + 1);
          await new Promise(resolve => setTimeout(resolve, 1000));
          retries++;
        }

        if (!session) {
          console.error('No session established after signup');
          throw new Error('No session established after signup');
        }

        if (fullName) {
          console.log('Updating profile with full name');
          const { error: profileErr } = await supabase
            .from('profiles')
            .update({ full_name: fullName })
            .eq('id', data.user.id);

          if (profileErr) {
            console.error('Profile update error:', profileErr);
            throw profileErr;
          }
        }

        await fetchProfile();
        router.push('/knowledge-repo');
      } else {
        console.log('Email verification required, verification email should be sent');
      }

      return { needsEmailVerification };
    } catch (error) {
      console.error('Signup process error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    setUser(null);
    router.push('/login');
  };

  const refreshProfile = fetchProfile;

  const checkEmailVerification = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return !!session;
    } catch (error) {
      console.error('Error checking email verification:', error);
      return false;
    }
  };

  /************ init ************/
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setUser(null);
          return;
        }

        if (session) {
          await fetchProfile();
        } else {
          setUser(null);
        }
      } catch (e) {
        console.error('Auth initialization error:', e);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      if (session) {
        await fetchProfile();
      } else {
        setUser(null);
      }
    });

    // Set up session refresh
    const refreshSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error refreshing session:', error);
        return;
      }
      if (session) {
        await fetchProfile();
      }
    };

    // Refresh session every 5 minutes
    const refreshInterval = setInterval(refreshSession, 5 * 60 * 1000);

    return () => {
      subscription.unsubscribe();
      clearInterval(refreshInterval);
    };
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    refreshProfile,
    checkEmailVerification,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
