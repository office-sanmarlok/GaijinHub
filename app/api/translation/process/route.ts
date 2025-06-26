import { type NextRequest, NextResponse } from 'next/server';
import { getTranslationQueueCount, processTranslationQueue } from '@/lib/translation-queue';

export const maxDuration = 8; // Vercel function timeout

export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.WEBHOOK_SECRET}`;

    if (authHeader !== expectedAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { check_queue_first } = body;

    // Check queue if requested
    if (check_queue_first) {
      const queueCount = await getTranslationQueueCount();
      if (queueCount === 0) {
        return NextResponse.json({
          message: 'Queue is empty',
          processed: 0,
          remaining: 0,
        });
      }
    }

    // Calculate dynamic batch size based on queue size
    const queueSize = await getTranslationQueueCount();
    const batchSize = Math.min(Math.max(1, Math.floor(queueSize / 10)), 10);
    const timeoutMs = batchSize * 2000; // 2 seconds per item

    // Process translations
    const result = await processTranslationQueue({
      maxItems: batchSize,
      timeoutMs,
    });

    return NextResponse.json({
      success: true,
      processed: result.processed,
      remaining: result.remaining,
      errors: result.errors.length > 0 ? result.errors : undefined,
    });
  } catch (error) {
    console.error('Translation queue processing error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
