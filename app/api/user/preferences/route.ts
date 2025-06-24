import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/supabase';

type UserPreferences = Database['public']['Tables']['user_preferences']['Row'];

export async function GET() {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user preferences
    const { data: preferences, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      return NextResponse.json(
        { error: 'Failed to fetch preferences' },
        { status: 500 }
      );
    }

    // Return default preferences if none exist
    const defaultPreferences: UserPreferences = {
      user_id: user.id,
      preferred_ui_language: 'ja',
      preferred_content_language: 'ja',
      auto_translate_enabled: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return NextResponse.json(preferences || defaultPreferences);
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      preferred_ui_language,
      preferred_content_language,
      auto_translate_enabled
    } = body;

    // Validate input
    const validLanguages = ['ja', 'en', 'zh-CN', 'zh-TW', 'ko'];
    if (preferred_ui_language && !validLanguages.includes(preferred_ui_language)) {
      return NextResponse.json(
        { error: 'Invalid UI language' },
        { status: 400 }
      );
    }
    if (preferred_content_language && !validLanguages.includes(preferred_content_language)) {
      return NextResponse.json(
        { error: 'Invalid content language' },
        { status: 400 }
      );
    }

    // Update preferences
    const updateData: Partial<UserPreferences> = {
      user_id: user.id,
      updated_at: new Date().toISOString()
    };

    if (preferred_ui_language !== undefined) {
      updateData.preferred_ui_language = preferred_ui_language;
    }
    if (preferred_content_language !== undefined) {
      updateData.preferred_content_language = preferred_content_language;
    }
    if (auto_translate_enabled !== undefined) {
      updateData.auto_translate_enabled = auto_translate_enabled;
    }

    const { data: preferences, error } = await supabase
      .from('user_preferences')
      .upsert(updateData)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update preferences' },
        { status: 500 }
      );
    }

    return NextResponse.json(preferences);
  } catch (error) {
    console.error('Error updating user preferences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}