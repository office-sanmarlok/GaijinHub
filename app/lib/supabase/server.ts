import { type CookieOptions, createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/supabase';

export const createClient = async () => {
  const cookieStore = await cookies();
  
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    {
      cookies: {
        get(name: string) {
          const cookie = cookieStore.get(name);
          return cookie?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({
              name,
              value,
              ...options,
            });
          } catch (error) {
            console.error(`Error setting cookie ${name}:`, error);
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({
              name,
              value: '',
              ...options,
            });
          } catch (error) {
            console.error(`Error removing cookie ${name}:`, error);
          }
        },
      },
    }
  );
};

export const getUser = async () => {
  const supabase = await createClient();
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) throw error;

    return user;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
};
