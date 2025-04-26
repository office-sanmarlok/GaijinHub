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

// ヘルパー関数: ユーザー情報取得とエラーハンドリング
export const getUser = async () => {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.auth.getUser();
    
    if (error) throw error;
    
    // ユーザーがない場合はnullを返すだけにして、エラーとしては扱わない
    return { user: data.user, error: null };
  } catch (error) {
    console.error('Error getting user:', error);
    return { user: null, error };
  }
}

// セッション情報の取得 (後方互換性のため)
export const getSession = async () => {
  const { user, error } = await getUser();
  
  // ユーザーがある場合はセッションも存在すると見なす
  const session = user ? { user } : null;
  
  return { session, error };
}

// セッションとユーザーデータが必要な保護された操作のためのヘルパー
export const requireAuth = async () => {
  const { user, error } = await getUser();
  
  if (error) throw error;
  if (!user) throw new AuthSessionMissingError();
  
  // 後方互換性のため、sessionの形式で返す
  return { user };
} 