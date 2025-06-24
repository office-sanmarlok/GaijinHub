-- GaijinHub i18n Schema Migration
-- This migration adds tables for internationalization support

-- 1. listing_translations table
CREATE TABLE IF NOT EXISTS listing_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  locale VARCHAR(10) NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  is_auto_translated BOOLEAN DEFAULT true,
  translated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(listing_id, locale)
);

-- Indexes for listing_translations
CREATE INDEX IF NOT EXISTS idx_listing_translations_listing_id ON listing_translations(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_translations_locale ON listing_translations(locale);

-- 2. user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_ui_language VARCHAR(10) DEFAULT 'ja',
  preferred_content_language VARCHAR(10) DEFAULT 'ja',
  auto_translate_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. translation_queue table
CREATE TABLE IF NOT EXISTS translation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  source_locale VARCHAR(10) NOT NULL,
  target_locales TEXT[] NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- Indexes for translation_queue
CREATE INDEX IF NOT EXISTS idx_translation_queue_status ON translation_queue(status);
CREATE INDEX IF NOT EXISTS idx_translation_queue_created_at ON translation_queue(created_at);

-- 4. Add original_language column to listings
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS original_language VARCHAR(10) DEFAULT 'ja';

-- 5. search_keyword_translations table for search optimization
CREATE TABLE IF NOT EXISTS search_keyword_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_keyword VARCHAR(255) NOT NULL,
  source_locale VARCHAR(10) NOT NULL,
  target_locale VARCHAR(10) NOT NULL,
  translated_keyword VARCHAR(255) NOT NULL,
  search_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(original_keyword, source_locale, target_locale)
);

-- Index for search_keyword_translations
CREATE INDEX IF NOT EXISTS idx_search_keyword_translations_keyword ON search_keyword_translations(original_keyword, source_locale);

-- 6. RPC Functions

-- Get listing with translations
CREATE OR REPLACE FUNCTION get_listing_with_translations(
  p_listing_id UUID,
  p_preferred_locale VARCHAR DEFAULT NULL
) RETURNS TABLE (
  listing JSONB,
  translations JSONB,
  preferred_translation JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    row_to_json(l.*)::jsonb as listing,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'locale', lt.locale,
          'title', lt.title,
          'body', lt.body,
          'is_auto_translated', lt.is_auto_translated,
          'translated_at', lt.translated_at
        )
      ) FILTER (WHERE lt.id IS NOT NULL),
      '[]'::jsonb
    ) as translations,
    CASE 
      WHEN p_preferred_locale IS NOT NULL THEN
        (SELECT row_to_json(lt.*)::jsonb
         FROM listing_translations lt
         WHERE lt.listing_id = l.id AND lt.locale = p_preferred_locale)
      ELSE NULL
    END as preferred_translation
  FROM listings l
  LEFT JOIN listing_translations lt ON l.id = lt.listing_id
  WHERE l.id = p_listing_id
  GROUP BY l.id;
END;
$$ LANGUAGE plpgsql;

-- Get translation queue count
CREATE OR REPLACE FUNCTION get_translation_queue_count()
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM translation_queue WHERE status = 'pending');
END;
$$ LANGUAGE plpgsql;

-- Process translation queue (helper function)
CREATE OR REPLACE FUNCTION get_pending_translations(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  id UUID,
  listing_id UUID,
  source_locale VARCHAR,
  target_locales TEXT[],
  listing_title VARCHAR,
  listing_body TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tq.id,
    tq.listing_id,
    tq.source_locale,
    tq.target_locales,
    l.title,
    l.body
  FROM translation_queue tq
  JOIN listings l ON tq.listing_id = l.id
  WHERE tq.status = 'pending' AND tq.retry_count < 3
  ORDER BY tq.created_at ASC
  LIMIT p_limit
  FOR UPDATE SKIP LOCKED;
END;
$$ LANGUAGE plpgsql;

-- Mark translation as processing
CREATE OR REPLACE FUNCTION mark_translation_processing(p_queue_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE translation_queue
  SET status = 'processing', processed_at = NOW()
  WHERE id = p_queue_id;
END;
$$ LANGUAGE plpgsql;

-- Mark translation as completed
CREATE OR REPLACE FUNCTION mark_translation_completed(p_queue_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE translation_queue
  SET status = 'completed', processed_at = NOW()
  WHERE id = p_queue_id;
END;
$$ LANGUAGE plpgsql;

-- Mark translation as failed
CREATE OR REPLACE FUNCTION mark_translation_failed(p_queue_id UUID, p_error_message TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE translation_queue
  SET 
    status = CASE 
      WHEN retry_count >= 2 THEN 'failed'
      ELSE 'pending'
    END,
    error_message = p_error_message,
    retry_count = retry_count + 1,
    processed_at = NOW()
  WHERE id = p_queue_id;
END;
$$ LANGUAGE plpgsql;