'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';

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

  const refreshSession = async () => {
    try {
      setIsLoading(true);
      // 安全な方法でユーザー情報を取得
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      // セッション情報も併せて取得（APIへの重複リクエストを避けるため）
      if (currentUser) {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
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
  };

  useEffect(() => {
    // 初期セッション取得
    refreshSession();

    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        setSession(session);
        setUser(session?.user || null);
        router.refresh();
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [router, supabase]);

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