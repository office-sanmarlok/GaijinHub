import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { Database } from '@/types/supabase';

/**
 * This API performs initial application setup.
 * It creates necessary tables and storage buckets.
 * In production, please implement appropriate access restrictions.
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({
              name,
              value,
              ...options,
            });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({
              name,
              value: '',
              ...options,
            });
          },
        },
      }
    );

    // Check if user is an administrator (implement appropriate authentication in actual implementation)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Login required' },
        { status: 401 }
      );
    }

    // Setup execution results
    interface SetupResult {
      success?: boolean;
      message: string;
      note?: string;
      manual_steps?: string[];
      sql?: string;
    }
    
    const results: Record<string, SetupResult> = {};

    // -----------------------------------
    // Create storage buckets
    // -----------------------------------
    // Note: Bucket creation is not possible with anon key
    // Create manually from Supabase dashboard or
    // use a service role key
    results.storage = {
      message: 'Please create storage buckets in the dashboard',
      note: 'Create a public bucket named "avatars"',
      manual_steps: [
        '1. Log in to Supabase dashboard',
        '2. Create bucket using Storage > New bucket',
        '3. Set bucket name to "avatars"',
        '4. Check "Make bucket public"',
        '5. Click create button'
      ]
    };

    // -----------------------------------
    // Create avatars table
    // -----------------------------------
    // Note: create_table_if_not_exists function doesn't exist by default
    // Creating tables manually from the Supabase dashboard is safer
    results.avatars_table = {
      success: false,
      message: 'Please create the avatars table from the dashboard',
      sql: `
CREATE TABLE IF NOT EXISTS public.avatars (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  avatar_path text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

-- Set up RLS policies
ALTER TABLE public.avatars ENABLE ROW LEVEL SECURITY;

-- Users can view their own avatars
CREATE POLICY "Users can view their own avatars" ON public.avatars
  FOR SELECT USING (auth.uid() = user_id);

-- Users can add their own avatars
CREATE POLICY "Users can add their own avatars" ON public.avatars
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own avatars" ON public.avatars
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own avatars
CREATE POLICY "Users can delete their own avatars" ON public.avatars
  FOR DELETE USING (auth.uid() = user_id);
      `
    };

    // Set up RLS policies
    // Note: To avoid SQL injection, using parameterized queries is recommended
    // For simplification, we recommend running this manually from the dashboard

    return NextResponse.json({
      success: true,
      message: 'Setup instructions have been generated. Please create tables and buckets in the dashboard.',
      results
    });
  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json(
      { error: 'Setup failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 
