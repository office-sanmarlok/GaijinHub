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

// Helper function: Get user info with error handling
export const getUser = async () => {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.auth.getUser();
    
    if (error) throw error;
    
    // If there's no user, return null rather than treating it as an error
    return { user: data.user, error: null };
  } catch (error) {
    console.error('Error getting user:', error);
    return { user: null, error };
  }
}

// Get session info (for backward compatibility)
export const getSession = async () => {
  const { user, error } = await getUser();
  
  // If there's a user, assume a session exists
  const session = user ? { user } : null;
  
  return { session, error };
}

// Helper for protected operations that require session and user data
export const requireAuth = async () => {
  const { user, error } = await getUser();
  
  if (error) throw error;
  if (!user) throw new AuthSessionMissingError();
  
  // Return in session format for backward compatibility
  return { user };
} 
