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
  const [isHydrated, setIsHydrated] = useState(false);

  // Fix hydration mismatch by ensuring client-only rendering
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  /************ helpers ************/
  const fetchProfile = async () => {
    try {
      console.log('🔄 Fetching fresh session and profile...');
      
      // Force refresh the session to sync with server
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('❌ Session refresh error:', error);
        // Try getting existing session as fallback
        const { data: fallbackData } = await supabase.auth.getSession();
        if (!fallbackData.session) {
          setUser(null);
          return;
        }
        // Use fallback session
        const session = fallbackData.session;
      }

      if (!session) {
        console.log('🚫 No session found');
        setUser(null);
        return;
      }

      console.log('✅ Session found for user:', session.user.id);

      // Fetch profile with retry logic
      let profile = null;
      let retries = 0;
      
      while (retries < 3) {
        const { data, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (!profileError) {
          profile = data;
          break;
        }

        console.warn(`❌ Profile fetch attempt ${retries + 1} failed:`, profileError);
        retries++;
        
        if (retries < 3) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      const userProfile: UserProfile = {
        id: session.user.id,
        email: session.user.email!,
        full_name: profile?.full_name,
        team_id: profile?.team_id,
        role: profile?.role,
      };

      console.log('✅ Setting user profile:', userProfile);
      setUser(userProfile);
      
      // Refresh router to sync middleware
      router.refresh();
      
    } catch (e) {
      console.error('❌ fetchProfile error:', e);
      setUser(null);
    }
  };

  /************ actions ************/
  const signIn = async (email: string, password: string) => {
    console.log('🔑 Starting sign in...');
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;

      if (data.session) {
        console.log('✅ Sign in successful');
        await fetchProfile();
      }
    } catch (error) {
      console.error('❌ Sign in error:', error);
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
      console.log('📝 Starting signup...');
      
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
      
      if (error) throw error;
      if (!data.user) throw new Error('Could not obtain new user id');

      const needsEmailVerification = !data.session;
      console.log('📧 Needs email verification:', needsEmailVerification);

      if (!needsEmailVerification && data.session) {
        if (fullName) {
          const { error: profileErr } = await supabase
            .from('profiles')
            .update({ full_name: fullName })
            .eq('id', data.user.id);

          if (profileErr) {
            console.error('❌ Profile update error:', profileErr);
          }
        }

        await fetchProfile();
        router.push('/knowledge-repo');
      }

      return { needsEmailVerification };
    } catch (error) {
      console.error('❌ Signup error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    console.log('🚪 Signing out...');
    try {
      // Clear user state immediately
      setUser(null);
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Force refresh to clear all cached data
      router.push('/login');
      router.refresh();
      
      // Clear any potential cached data
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    } catch (error) {
      console.error('❌ Sign out error:', error);
      throw error;
    }
  };

  const refreshProfile = fetchProfile;

  const checkEmailVerification = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return !!session;
    } catch (error) {
      console.error('❌ Error checking email verification:', error);
      return false;
    }
  };

  /************ init ************/
  useEffect(() => {
    if (!isHydrated) return;

    let isMounted = true;

    const initializeAuth = async () => {
      try {
        console.log('🚀 Initializing auth (client-side)...');
        setLoading(true);

        await fetchProfile();
      } catch (e) {
        console.error('❌ Auth initialization error:', e);
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      
      console.log('🔔 Auth state changed:', event, session?.user?.id);
      
      switch (event) {
        case 'SIGNED_IN':
          if (session) {
            console.log('✅ User signed in, fetching profile...');
            await fetchProfile();
          }
          break;
          
        case 'SIGNED_OUT':
          console.log('🚪 User signed out');
          setUser(null);
          break;
          
        case 'TOKEN_REFRESHED':
          if (session && !user) {
            console.log('🔄 Token refreshed, fetching profile...');
            await fetchProfile();
          }
          break;
          
        default:
          break;
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [isHydrated]);

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    refreshProfile,
    checkEmailVerification,
  };

  // Prevent hydration mismatch by not rendering until hydrated
  if (!isHydrated) {
    return <div>{children}</div>;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}