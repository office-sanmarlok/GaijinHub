import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/supabase'

export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase credentials');
    throw new Error('Missing Supabase credentials');
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export class AuthSessionMissingError extends AuthError {
  constructor() {
    super('Auth session missing! Please sign in.');
    this.name = 'AuthSessionMissingError';
  }
}

// ヘルパー関数: セッション取得とエラーハンドリング
export const getSession = async () => {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.auth.getSession();
    
    if (error) throw error;
    
    // セッションがない場合はnullを返すだけにして、エラーとしては扱わない
    return { session: data.session, error: null };
  } catch (error) {
    console.error('Error getting session:', error);
    return { session: null, error };
  }
}

// セッションとユーザーデータが必要な保護された操作のためのヘルパー
export const requireAuth = async () => {
  const { session, error } = await getSession();
  
  if (error) throw error;
  if (!session) throw new AuthSessionMissingError();
  
  return session;
} 