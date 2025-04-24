import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

export const createServerSupabaseClient = async () => {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    {
      cookies: {
        async get(name: string) {
          const cookieStore = cookies();
          const cookie = cookieStore.get(name);
          return cookie?.value;
        },
        async set(name: string, value: string, options: CookieOptions) {
          try {
            const cookieStore = cookies();
            cookieStore.set({
              name,
              value,
              ...options,
            });
          } catch (error) {
            console.error(`Error setting cookie ${name}:`, error);
          }
        },
        async remove(name: string, options: CookieOptions) {
          try {
            const cookieStore = cookies();
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
  const supabase = await createServerSupabaseClient();
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error('Error fetching user:', error.message);
      return { user: null, error };
    }
    return { user, error: null };
  } catch (error) {
    console.error('Unexpected error in getUser:', error);
    return { user: null, error };
  }
};