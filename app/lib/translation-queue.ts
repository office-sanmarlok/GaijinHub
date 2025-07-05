import { createClient } from '@/lib/supabase/server';
import { type Locale, locales } from '../../i18n/config';
import { getDeepLClient } from './deepl/client';
import { detectLanguage } from './language-detection';
import { logger } from '@/lib/utils/logger';

interface QueueItem {
  id: string;
  listing_id: string;
  source_locale: string;
  target_locales: string[];
  listing_title: string;
  listing_body: string;
}

/**
 * Get the count of pending items in the translation queue
 */
export async function getTranslationQueueCount(): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from('translation_queue')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')
    .lt('retry_count', 3);

  if (error) {
    logger.error('Error getting queue count:', error);
    return 0;
  }

  return count || 0;
}

/**
 * Process translation queue items
 */
export async function processTranslationQueue(options: { maxItems?: number; timeoutMs?: number } = {}): Promise<{
  processed: number;
  remaining: number;
  errors: string[];
}> {
  const { maxItems = 10, timeoutMs = 8000 } = options;
  const supabase = await createClient();
  const deeplClient = getDeepLClient();

  const startTime = Date.now();
  let processed = 0;
  const errors: string[] = [];

  try {
    // Get pending translations
    const { data: queueItems, error: fetchError } = await supabase.rpc('get_pending_translations', {
      p_limit: maxItems,
    });

    if (fetchError || !queueItems) {
      throw new Error(`Failed to fetch queue items: ${fetchError?.message}`);
    }

    // Process each item
    for (const item of queueItems as QueueItem[]) {
      // Check timeout
      if (Date.now() - startTime > timeoutMs) {
        logger.debug('Translation queue timeout reached');
        break;
      }

      try {
        // Mark as processing
        await supabase.rpc('mark_translation_processing', {
          p_queue_id: item.id,
        });

        // Translate to all target languages
        const targetLocales = item.target_locales.filter((locale) => locales.includes(locale as Locale)) as Locale[];

        // Translate to each target language
        const titleTranslations: Record<Locale, string> = {} as Record<Locale, string>;
        const bodyTranslations: Record<Locale, string> = {} as Record<Locale, string>;
        
        for (const targetLocale of targetLocales) {
          try {
            titleTranslations[targetLocale] = await deeplClient.translateText(
              item.listing_title,
              item.source_locale as Locale,
              targetLocale
            );
            
            bodyTranslations[targetLocale] = await deeplClient.translateText(
              item.listing_body,
              item.source_locale as Locale,
              targetLocale
            );
          } catch (error) {
            logger.error(`Failed to translate to ${targetLocale}:`, error);
            throw error;
          }
        }

        // Save translations
        for (const locale of targetLocales) {
          const { error: insertError } = await supabase.from('listing_translations').upsert(
            {
              listing_id: item.listing_id,
              locale,
              title: titleTranslations[locale],
              body: bodyTranslations[locale],
              is_auto_translated: true,
              translated_at: new Date().toISOString(),
            },
            {
              onConflict: 'listing_id,locale',
            }
          );

          if (insertError) {
            throw new Error(`Failed to save translation: ${insertError.message}`);
          }
        }

        // Mark as completed
        await supabase.rpc('mark_translation_completed', {
          p_queue_id: item.id,
        });

        processed++;
      } catch (itemError) {
        const errorMessage = itemError instanceof Error ? itemError.message : 'Unknown error';
        errors.push(`Item ${item.id}: ${errorMessage}`);

        // Mark as failed
        await supabase.rpc('mark_translation_failed', {
          p_queue_id: item.id,
          p_error_message: errorMessage,
        });
      }
    }

    // Get remaining count
    const remaining = await getTranslationQueueCount();

    return {
      processed,
      remaining,
      errors,
    };
  } catch (error) {
    logger.error('Translation queue processing error:', error);
    return {
      processed,
      remaining: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

/**
 * Add a listing to the translation queue
 */
export async function addToTranslationQueue(
  listingId: string,
  sourceLocale?: Locale
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  try {
    // Get listing details
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('id, title, body, original_language')
      .eq('id', listingId)
      .single();

    if (listingError || !listing) {
      return { success: false, error: 'Listing not found' };
    }

    // Detect language if not provided
    let detectedLocale = sourceLocale || listing.original_language;
    if (!detectedLocale) {
      const detection = await detectLanguage(`${listing.title} ${listing.body}`);
      detectedLocale = detection.language;

      // Update listing with detected language
      await supabase.from('listings').update({ original_language: detectedLocale }).eq('id', listingId);
    }

    // Determine target languages (all except source)
    const targetLocales = locales.filter((locale) => locale !== detectedLocale);

    // Add to queue
    const { error: queueError } = await supabase.from('translation_queue').insert({
      listing_id: listingId,
      source_locale: detectedLocale,
      target_locales: targetLocales,
      status: 'pending',
    });

    if (queueError) {
      return { success: false, error: queueError.message };
    }

    // Webhookを呼び出してGitHub Actionsをトリガー（本番環境のみ）
    if (process.env.NODE_ENV === 'production' && process.env.WEBHOOK_SECRET) {
      try {
        const webhookUrl = process.env.NEXT_PUBLIC_APP_URL 
          ? `${process.env.NEXT_PUBLIC_APP_URL}/api/translation/webhook`
          : `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : ''}/api/translation/webhook`;
          
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.WEBHOOK_SECRET}`,
          },
          body: JSON.stringify({ listing_id: listingId }),
        });

        if (!response.ok) {
          logger.error('Failed to trigger translation webhook:', await response.text());
        } else {
          logger.debug('Translation webhook triggered successfully');
        }
      } catch (webhookError) {
        logger.error('Error calling translation webhook:', webhookError);
        // Webhookが失敗してもキューは成功したので続行
      }
    }

    return { success: true };
  } catch (error) {
    logger.error('Error adding to translation queue:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
