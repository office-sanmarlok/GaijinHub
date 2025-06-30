import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Debug: Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    // Debug: Get listing
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('*')
      .eq('id', id)
      .single();

    return NextResponse.json({
      debug: {
        authCheck: {
          hasUser: !!user,
          userId: user?.id,
          authError: authError?.message || null,
        },
        listingCheck: {
          hasListing: !!listing,
          listingUserId: listing?.user_id,
          listingError: listingError?.message || null,
        },
        ownershipCheck: user && listing ? user.id === listing.user_id : null,
      }
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Debug error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}