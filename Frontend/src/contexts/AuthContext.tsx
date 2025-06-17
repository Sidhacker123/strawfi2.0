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
  const [initialized, setInitialized] = useState(false);

  /************ helpers ************/
  const fetchProfile = async (userId?: string) => {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error('Session error:', error);
        setUser(null);
        return;
      }

      if (!session) {
        setUser(null);
        return;
      }

      const targetUserId = userId || session.user.id;

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetUserId)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        // Still set basic user info even if profile fetch fails
        setUser({
          id: session.user.id,
          email: session.user.email!,
        });
        return;
      }

      setUser({
        id: session.user.id,
        email: session.user.email!,
        full_name: profile?.full_name,
        team_id: profile?.team_id,
        role: profile?.role,
      });
    } catch (e) {
      console.error('fetchProfile error:', e);
      setUser(null);
    }
  };

  /************ actions ************/
  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;

      if (data.session) {
        await fetchProfile(data.user.id);
        // Force router refresh to update middleware
        router.refresh();
      }
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
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

      if (!needsEmailVerification && data.session) {
        console.log('No verification needed, proceeding with profile setup');

        if (fullName) {
          console.log('Updating profile with full name');
          const { error: profileErr } = await supabase
            .from('profiles')
            .update({ full_name: fullName })
            .eq('id', data.user.id);

          if (profileErr) {
            console.error('Profile update error:', profileErr);
            // Don't throw here, just log the error
          }
        }

        await fetchProfile(data.user.id);
        router.push('/knowledge-repo');
        router.refresh();
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
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const refreshProfile = () => fetchProfile();

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
        console.log('Initializing auth...');
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setUser(null);
          setLoading(false);
          setInitialized(true);
          return;
        }

        if (session) {
          console.log('Session found, fetching profile...');
          await fetchProfile(session.user.id);
        } else {
          console.log('No session found');
          setUser(null);
        }
      } catch (e) {
        console.error('Auth initialization error:', e);
        setUser(null);
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };

    if (!initialized) {
      initializeAuth();
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      
      if (event === 'SIGNED_IN') {
        if (session) {
          await fetchProfile(session.user.id);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      } else if (event === 'TOKEN_REFRESHED') {
        if (session) {
          // Only fetch profile if we don't have user data yet
          if (!user) {
            await fetchProfile(session.user.id);
          }
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [initialized, user]); // Add user to dependencies

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