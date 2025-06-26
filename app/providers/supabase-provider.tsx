'use client';

import type { Session, User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type SupabaseContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

const SupabaseContext = createContext<SupabaseContextType>({
  user: null,
  session: null,
  isLoading: true,
  signOut: async () => {},
  refreshSession: async () => {},
});

export const useSupabase = () => useContext(SupabaseContext);

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  const refreshSession = useCallback(async () => {
    try {
      setIsLoading(true);
      // Get user info safely
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      // Also get session info to avoid redundant API calls
      if (currentUser) {
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();
        setSession(currentSession);
      } else {
        setSession(null);
      }

      setUser(currentUser);
    } catch (error) {
      console.error('Error refreshing session:', error);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    // Initial session retrieval
    refreshSession();

    // Monitor auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      setSession(session);
      setUser(session?.user || null);
      router.refresh();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, supabase, refreshSession]);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <SupabaseContext.Provider
      value={{
        user,
        session,
        isLoading,
        signOut,
        refreshSession,
      }}
    >
      {children}
    </SupabaseContext.Provider>
  );
}
