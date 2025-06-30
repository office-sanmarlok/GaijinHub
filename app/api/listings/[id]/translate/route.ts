import { type NextRequest, NextResponse } from 'next/server';
import { triggerTranslationWorkflow } from '@/lib/github-actions-trigger';
import { createClient } from '@/lib/supabase/server';
import { addToTranslationQueue } from '@/lib/translation-queue';
import type { Locale } from '../../../../../i18n/config';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user owns the listing
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('user_id')
      .eq('id', id)
      .single();

    if (listingError || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    if (listing.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { sourceLocale } = body as {
      sourceLocale?: Locale;
    };

    // Add to translation queue
    const result = await addToTranslationQueue(id, sourceLocale);

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to queue translation' }, { status: 500 });
    }

    // Trigger GitHub Actions workflow
    await triggerTranslationWorkflow(id);

    return NextResponse.json({
      success: true,
      message: 'Translation queued successfully',
    });
  } catch (error) {
    console.error('Error queuing translation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
