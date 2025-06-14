# GaijinHub 多言語実装手順書

## 前提条件
- Node.js 18以上
- Supabase CLIがインストール済み
- Google Cloud Translation APIまたはDeepL APIのアカウント

## Phase 1: 基盤整備（1-2週間）

### 1.1 データベーススキーマの更新

#### Step 1: 翻訳関連テーブルの作成
```bash
# Supabase Dashboardまたはローカルで実行
```

```sql
-- 1. listing_translationsテーブル作成
CREATE TABLE listing_translations (
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

-- インデックス作成
CREATE INDEX idx_listing_translations_listing_id ON listing_translations(listing_id);
CREATE INDEX idx_listing_translations_locale ON listing_translations(locale);

-- 2. user_preferencesテーブル作成
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_ui_language VARCHAR(10) DEFAULT 'ja',
  preferred_content_language VARCHAR(10) DEFAULT 'ja',
  auto_translate_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. translation_queueテーブル作成
CREATE TABLE translation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  source_locale VARCHAR(10) NOT NULL,
  target_locales TEXT[] NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- 4. listingsテーブルの拡張
ALTER TABLE listings 
ADD COLUMN detected_language VARCHAR(10) DEFAULT 'ja',
ADD COLUMN original_language VARCHAR(10) DEFAULT 'ja';

-- 5. RLSポリシーの設定
ALTER TABLE listing_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE translation_queue ENABLE ROW LEVEL SECURITY;

-- listing_translations: 誰でも読み取り可能
CREATE POLICY "Public read access" ON listing_translations
  FOR SELECT USING (true);

-- listing_translations: 投稿者のみ更新可能
CREATE POLICY "Users can update own listing translations" ON listing_translations
  FOR UPDATE USING (
    listing_id IN (
      SELECT id FROM listings WHERE user_id = auth.uid()
    )
  );

-- user_preferences: 本人のみアクセス可能
CREATE POLICY "Users can manage own preferences" ON user_preferences
  FOR ALL USING (user_id = auth.uid());
```

#### Step 2: RPC関数の作成
```sql
-- リスティングと全翻訳を取得する関数
CREATE OR REPLACE FUNCTION get_listing_with_translations(
  p_listing_id UUID,
  p_preferred_locale VARCHAR DEFAULT NULL
)
RETURNS TABLE (
  listing JSONB,
  translations JSONB,
  preferred_translation JSONB
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH listing_data AS (
    SELECT 
      l.*,
      u.email as user_email,
      av.avatar_path,
      sg.station_name as station_name,
      sg.station_name_r as station_name_romaji,
      m.muni_name as municipality_name,
      m.muni_name_r as municipality_name_romaji,
      p.pref_name as prefecture_name,
      p.pref_name_r as prefecture_name_romaji
    FROM listings l
    LEFT JOIN auth.users u ON l.user_id = u.id
    LEFT JOIN avatars av ON l.user_id = av.user_id
    LEFT JOIN station_groups sg ON l.station_g_cd = sg.station_g_cd
    LEFT JOIN municipalities m ON l.muni_id = m.muni_id
    LEFT JOIN prefectures p ON m.pref_id = p.pref_id
    WHERE l.id = p_listing_id
  ),
  all_translations AS (
    SELECT 
      jsonb_object_agg(
        locale,
        jsonb_build_object(
          'title', title,
          'body', body,
          'is_auto_translated', is_auto_translated,
          'translated_at', translated_at
        )
      ) as translations
    FROM listing_translations
    WHERE listing_id = p_listing_id
  )
  SELECT 
    to_jsonb(ld.*) as listing,
    COALESCE(at.translations, '{}'::jsonb) as translations,
    CASE 
      WHEN p_preferred_locale IS NOT NULL THEN
        at.translations->p_preferred_locale
      ELSE NULL
    END as preferred_translation
  FROM listing_data ld
  CROSS JOIN all_translations at;
END;
$$;

-- 多言語検索関数
CREATE OR REPLACE FUNCTION search_listings_multilingual(
  p_query TEXT DEFAULT NULL,
  p_search_locales TEXT[] DEFAULT ARRAY['ja', 'en', 'zh-CN', 'zh-TW', 'ko'],
  p_category TEXT DEFAULT NULL,
  p_station_g_cds TEXT[] DEFAULT NULL,
  p_pref_ids TEXT[] DEFAULT NULL,
  p_muni_ids TEXT[] DEFAULT NULL,
  p_line_ids TEXT[] DEFAULT NULL,
  p_min_price INTEGER DEFAULT NULL,
  p_max_price INTEGER DEFAULT NULL,
  p_sort TEXT DEFAULT 'newest',
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  body TEXT,
  category TEXT,
  price NUMERIC,
  created_at TIMESTAMPTZ,
  user_id UUID,
  location JSONB,
  translations JSONB,
  total_count BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- 実装は既存のsearch_listingsを拡張
  -- 翻訳テーブルも検索対象に含める
  RETURN QUERY
  WITH filtered_listings AS (
    SELECT DISTINCT l.*
    FROM listings l
    LEFT JOIN listing_translations lt ON l.id = lt.listing_id
    WHERE 
      (p_category IS NULL OR l.category = p_category)
      AND (p_min_price IS NULL OR l.price >= p_min_price)
      AND (p_max_price IS NULL OR l.price <= p_max_price)
      AND (p_station_g_cds IS NULL OR l.station_g_cd = ANY(p_station_g_cds))
      AND (p_muni_ids IS NULL OR l.muni_id = ANY(p_muni_ids))
      AND (p_query IS NULL OR 
        l.title ILIKE '%' || p_query || '%' OR 
        l.body ILIKE '%' || p_query || '%' OR
        (lt.locale = ANY(p_search_locales) AND (
          lt.title ILIKE '%' || p_query || '%' OR 
          lt.body ILIKE '%' || p_query || '%'
        ))
      )
  ),
  counted AS (
    SELECT COUNT(*) as total FROM filtered_listings
  )
  SELECT 
    fl.id,
    fl.title,
    fl.body,
    fl.category,
    fl.price,
    fl.created_at,
    fl.user_id,
    jsonb_build_object(
      'station_g_cd', fl.station_g_cd,
      'muni_id', fl.muni_id,
      'lat', fl.lat,
      'lng', fl.lng
    ) as location,
    COALESCE(
      jsonb_object_agg(
        lt.locale,
        jsonb_build_object('title', lt.title, 'body', lt.body)
      ) FILTER (WHERE lt.locale IS NOT NULL),
      '{}'::jsonb
    ) as translations,
    c.total as total_count
  FROM filtered_listings fl
  CROSS JOIN counted c
  LEFT JOIN listing_translations lt ON fl.id = lt.listing_id
  GROUP BY fl.id, fl.title, fl.body, fl.category, fl.price, 
           fl.created_at, fl.user_id, fl.station_g_cd, 
           fl.muni_id, fl.lat, fl.lng, c.total
  ORDER BY 
    CASE WHEN p_sort = 'newest' THEN fl.created_at END DESC,
    CASE WHEN p_sort = 'price_asc' THEN fl.price END ASC,
    CASE WHEN p_sort = 'price_desc' THEN fl.price END DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;
```

#### Step 3: TypeScript型定義の更新
```bash
# Supabase CLIで型を再生成
npx supabase gen types typescript --project-id sidtuvasgtmodtrjmhbw > app/types/supabase.ts
```

### 1.2 next-intlの設定

#### Step 1: 設定ファイルの作成
```typescript
// app/i18n/config.ts
export const locales = ['ja', 'en', 'zh-CN', 'zh-TW', 'ko'] as const;
export type Locale = typeof locales[number];

export const defaultLocale: Locale = 'ja';

export const localeNames: Record<Locale, string> = {
  'ja': '日本語',
  'en': 'English',
  'zh-CN': '简体中文',
  'zh-TW': '繁體中文',
  'ko': '한국어'
};

// app/i18n/request.ts
import {notFound} from 'next/navigation';
import {getRequestConfig} from 'next-intl/server';
import {locales} from './config';

export default getRequestConfig(async ({locale}) => {
  if (!locales.includes(locale as any)) notFound();

  return {
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});
```

#### Step 2: ミドルウェアの更新
```typescript
// middleware.ts
import createMiddleware from 'next-intl/middleware';
import {NextRequest, NextResponse} from 'next/server';
import {locales, defaultLocale} from './app/i18n/config';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always'
});

export default async function middleware(req: NextRequest) {
  // 既存の認証ミドルウェアロジック
  const {pathname} = req.nextUrl;
  
  // APIルートとstaticファイルはスキップ
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 認証が必要なルート
  const protectedPaths = ['/account', '/listings/new'];
  const locale = pathname.split('/')[1];
  const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/';
  
  if (protectedPaths.some(path => pathWithoutLocale.startsWith(path))) {
    // 認証チェック（既存のロジック）
  }

  // 国際化ミドルウェアを実行
  return intlMiddleware(req);
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)']
};
```

#### Step 3: App Routerの構造変更
```bash
# ディレクトリ構造を変更
mkdir -p app/[locale]
mv app/(main)/* app/[locale]/
mv app/layout.tsx app/[locale]/layout.tsx
```

```typescript
// app/[locale]/layout.tsx
import {notFound} from 'next/navigation';
import {NextIntlClientProvider} from 'next-intl';
import {locales} from '@/app/i18n/config';

export function generateStaticParams() {
  return locales.map((locale) => ({locale}));
}

export default async function LocaleLayout({
  children,
  params: {locale}
}: {
  children: React.ReactNode;
  params: {locale: string};
}) {
  if (!locales.includes(locale as any)) {
    notFound();
  }

  let messages;
  try {
    messages = (await import(`../../messages/${locale}.json`)).default;
  } catch (error) {
    notFound();
  }

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
```

### 1.3 翻訳ファイルの準備

#### Step 1: メッセージファイルの作成
```bash
mkdir -p messages
```

```json
// messages/ja.json
{
  "common": {
    "search": "検索",
    "login": "ログイン",
    "logout": "ログアウト",
    "post": "投稿する",
    "cancel": "キャンセル",
    "save": "保存",
    "delete": "削除",
    "edit": "編集",
    "loading": "読み込み中...",
    "error": "エラーが発生しました"
  },
  "navigation": {
    "home": "ホーム",
    "listings": "リスティング",
    "account": "アカウント",
    "favorites": "お気に入り"
  },
  "categories": {
    "housing": "住居",
    "jobs": "仕事",
    "items": "売買",
    "services": "サービス"
  },
  "listing": {
    "title": "タイトル",
    "description": "説明",
    "price": "価格",
    "location": "場所",
    "category": "カテゴリー",
    "postedBy": "投稿者",
    "postedAt": "投稿日",
    "contactSeller": "出品者に連絡"
  },
  "search": {
    "placeholder": "何をお探しですか？",
    "filters": "フィルター",
    "sortBy": "並び替え",
    "newest": "新着順",
    "priceAsc": "価格が安い順",
    "priceDesc": "価格が高い順",
    "distance": "距離順"
  },
  "auth": {
    "signIn": "サインイン",
    "signUp": "サインアップ",
    "email": "メールアドレス",
    "password": "パスワード",
    "confirmPassword": "パスワード確認",
    "forgotPassword": "パスワードを忘れた方",
    "alreadyHaveAccount": "すでにアカウントをお持ちの方",
    "createNewAccount": "新規アカウント作成"
  },
  "footer": {
    "about": "GaijinHubについて",
    "contact": "お問い合わせ",
    "terms": "利用規約",
    "privacy": "プライバシーポリシー"
  },
  "language": {
    "switchLanguage": "言語を切り替え",
    "currentLanguage": "日本語",
    "contentLanguage": "コンテンツ言語",
    "uiLanguage": "インターフェース言語",
    "autoTranslate": "自動翻訳",
    "translationNote": "この内容は自動翻訳されています"
  }
}

// messages/en.json
{
  "common": {
    "search": "Search",
    "login": "Login",
    "logout": "Logout",
    "post": "Post",
    "cancel": "Cancel",
    "save": "Save",
    "delete": "Delete",
    "edit": "Edit",
    "loading": "Loading...",
    "error": "An error occurred"
  },
  // ... 英語版の翻訳
}

// 同様に zh-CN.json, zh-TW.json, ko.json を作成
```

## Phase 2: UI多言語化（2-3週間）

### 2.1 コンポーネントの国際化

#### Step 1: 言語切り替えコンポーネント
```typescript
// app/components/language-switcher.tsx
'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { locales, localeNames } from '@/app/i18n/config';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleChange = (newLocale: string) => {
    // 現在のパスから言語部分を除去
    const segments = pathname.split('/');
    segments[1] = newLocale;
    const newPath = segments.join('/');
    
    router.push(newPath);
  };

  return (
    <Select value={locale} onValueChange={handleChange}>
      <SelectTrigger className="w-[140px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {locales.map((loc) => (
          <SelectItem key={loc} value={loc}>
            {localeNames[loc]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

#### Step 2: コンテンツ言語セレクター
```typescript
// app/components/content-language-selector.tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';
import { Locale, localeNames } from '@/app/i18n/config';

interface ContentLanguageSelectorProps {
  available: Locale[];
  current: Locale;
  onChange: (locale: Locale) => void;
  isAutoTranslated?: Record<Locale, boolean>;
}

export function ContentLanguageSelector({
  available,
  current,
  onChange,
  isAutoTranslated = {}
}: ContentLanguageSelectorProps) {
  const t = useTranslations('language');

  return (
    <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
      <span className="text-sm text-muted-foreground">
        {t('contentLanguage')}:
      </span>
      <div className="flex gap-2">
        {available.map((locale) => (
          <button
            key={locale}
            onClick={() => onChange(locale)}
            className={`
              px-3 py-1 rounded-md text-sm font-medium transition-colors
              ${current === locale 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-background hover:bg-accent'
              }
            `}
          >
            {localeNames[locale]}
            {isAutoTranslated[locale] && (
              <Badge variant="secondary" className="ml-1">
                <Info className="w-3 h-3 mr-1" />
                Auto
              </Badge>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
```

#### Step 3: 既存コンポーネントの更新例
```typescript
// app/[locale]/components/header.tsx
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/app/components/language-switcher';

export function Header() {
  const t = useTranslations('navigation');

  return (
    <header>
      <nav>
        <Link href="/listings">{t('listings')}</Link>
        <Link href="/account">{t('account')}</Link>
      </nav>
      <LanguageSwitcher />
    </header>
  );
}

// app/[locale]/listings/page.tsx
import { useTranslations } from 'next-intl';

export default function ListingsPage() {
  const t = useTranslations('listing');

  return (
    <div>
      <h1>{t('title')}</h1>
      {/* 既存のロジック */}
    </div>
  );
}
```

## Phase 3: コンテンツ翻訳（3-4週間）

### 3.1 翻訳APIの統合

#### Step 1: 翻訳サービスの実装
```typescript
// app/lib/translation/translator.ts
import { Locale } from '@/app/i18n/config';

interface TranslationService {
  translate(text: string, from: Locale, to: Locale): Promise<string>;
  translateBatch(texts: string[], from: Locale, to: Locale): Promise<string[]>;
  detectLanguage(text: string): Promise<Locale>;
}

// Google Cloud Translation実装例
export class GoogleTranslator implements TranslationService {
  private client: any; // @google-cloud/translate

  constructor(apiKey: string) {
    // クライアント初期化
  }

  async translate(text: string, from: Locale, to: Locale): Promise<string> {
    // 実装
  }

  async translateBatch(texts: string[], from: Locale, to: Locale): Promise<string[]> {
    // 実装
  }

  async detectLanguage(text: string): Promise<Locale> {
    // 実装
  }
}

// DeepL実装例
export class DeepLTranslator implements TranslationService {
  // 同様の実装
}

// ファクトリー
export function createTranslator(): TranslationService {
  const service = process.env.TRANSLATION_SERVICE;
  
  switch (service) {
    case 'google':
      return new GoogleTranslator(process.env.GOOGLE_API_KEY!);
    case 'deepl':
      return new DeepLTranslator(process.env.DEEPL_API_KEY!);
    default:
      throw new Error('No translation service configured');
  }
}
```

#### Step 2: 翻訳ジョブの実装
```typescript
// app/lib/jobs/translation-job.ts
import { createClient } from '@/app/lib/supabase/server';
import { createTranslator } from '@/app/lib/translation/translator';
import { locales, Locale } from '@/app/i18n/config';

export async function processTranslationQueue() {
  const supabase = await createClient();
  const translator = createTranslator();

  // ペンディングのジョブを取得
  const { data: jobs, error } = await supabase
    .from('translation_queue')
    .select('*')
    .eq('status', 'pending')
    .limit(10);

  if (error || !jobs) return;

  for (const job of jobs) {
    try {
      // ステータスを処理中に更新
      await supabase
        .from('translation_queue')
        .update({ status: 'processing' })
        .eq('id', job.id);

      // 元のリスティングを取得
      const { data: listing } = await supabase
        .from('listings')
        .select('title, body, detected_language')
        .eq('id', job.listing_id)
        .single();

      if (!listing) continue;

      const sourceLocale = listing.detected_language || 'ja';
      
      // 各言語へ翻訳
      for (const targetLocale of job.target_locales) {
        if (targetLocale === sourceLocale) continue;

        const [translatedTitle, translatedBody] = await translator.translateBatch(
          [listing.title, listing.body],
          sourceLocale as Locale,
          targetLocale as Locale
        );

        // 翻訳を保存
        await supabase
          .from('listing_translations')
          .upsert({
            listing_id: job.listing_id,
            locale: targetLocale,
            title: translatedTitle,
            body: translatedBody,
            is_auto_translated: true
          });
      }

      // ジョブを完了
      await supabase
        .from('translation_queue')
        .update({ 
          status: 'completed',
          processed_at: new Date().toISOString()
        })
        .eq('id', job.id);

    } catch (error) {
      // エラー処理
      await supabase
        .from('translation_queue')
        .update({ 
          status: 'failed',
          error_message: error.message
        })
        .eq('id', job.id);
    }
  }
}
```

#### Step 3: APIエンドポイントの実装
```typescript
// app/api/listings/[id]/translations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .rpc('get_listing_with_translations', {
      p_listing_id: params.id
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// app/api/listings/[id]/translate/route.ts
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const { targetLocales } = await request.json();

  // 翻訳キューに追加
  const { error } = await supabase
    .from('translation_queue')
    .insert({
      listing_id: params.id,
      source_locale: 'ja', // または検出された言語
      target_locales: targetLocales || ['en', 'zh-CN', 'zh-TW', 'ko']
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
```

### 3.2 リスティング詳細ページの実装

```typescript
// app/[locale]/listings/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ContentLanguageSelector } from '@/app/components/content-language-selector';
import { Locale } from '@/app/i18n/config';

export default function ListingDetailPage({ params }: { params: { id: string } }) {
  const uiLocale = useLocale() as Locale;
  const t = useTranslations('listing');
  
  const [listing, setListing] = useState<any>(null);
  const [translations, setTranslations] = useState<any>({});
  const [contentLocale, setContentLocale] = useState<Locale>(uiLocale);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchListingWithTranslations();
  }, [params.id]);

  const fetchListingWithTranslations = async () => {
    const response = await fetch(`/api/listings/${params.id}/translations`);
    const data = await response.json();
    
    setListing(data[0].listing);
    setTranslations(data[0].translations);
    setLoading(false);
  };

  if (loading) return <div>{t('common.loading')}</div>;

  // 利用可能な言語を取得
  const availableLocales = ['ja', ...Object.keys(translations)] as Locale[];
  
  // 表示するコンテンツを決定
  const displayTitle = contentLocale === 'ja' 
    ? listing.title 
    : translations[contentLocale]?.title || listing.title;
    
  const displayBody = contentLocale === 'ja'
    ? listing.body
    : translations[contentLocale]?.body || listing.body;

  const isAutoTranslated = contentLocale !== 'ja' && 
    translations[contentLocale]?.is_auto_translated;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* コンテンツ言語セレクター */}
      <ContentLanguageSelector
        available={availableLocales}
        current={contentLocale}
        onChange={setContentLocale}
        isAutoTranslated={{
          [contentLocale]: isAutoTranslated
        }}
      />

      {/* 自動翻訳の注意書き */}
      {isAutoTranslated && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            {t('language.translationNote')}
          </p>
        </div>
      )}

      {/* リスティング内容 */}
      <div className="mt-6">
        <h1 className="text-3xl font-bold">{displayTitle}</h1>
        <div className="mt-4 prose max-w-none">
          {displayBody.split('\n').map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </div>

      {/* その他の情報（価格、場所など）はそのまま表示 */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div>
          <span className="text-sm text-gray-500">{t('price')}</span>
          <p className="text-xl font-semibold">¥{listing.price}</p>
        </div>
        <div>
          <span className="text-sm text-gray-500">{t('location')}</span>
          <p>{listing.station_name} / {listing.municipality_name}</p>
        </div>
      </div>
    </div>
  );
}
```

## Phase 4: 最適化とテスト（1-2週間）

### 4.1 SEO最適化

```typescript
// app/[locale]/listings/[id]/metadata.ts
import { Metadata } from 'next';
import { locales } from '@/app/i18n/config';

export async function generateMetadata({ 
  params 
}: { 
  params: { id: string; locale: string } 
}): Promise<Metadata> {
  // リスティングデータを取得
  const listing = await getListingWithTranslations(params.id);
  
  // 現在の言語での内容
  const title = params.locale === 'ja' 
    ? listing.title 
    : listing.translations[params.locale]?.title || listing.title;

  // 代替言語のURL
  const languages = locales.reduce((acc, locale) => {
    acc[locale] = `/${locale}/listings/${params.id}`;
    return acc;
  }, {} as Record<string, string>);

  return {
    title,
    alternates: {
      languages
    },
    openGraph: {
      title,
      locale: params.locale,
      alternateLocale: locales.filter(l => l !== params.locale)
    }
  };
}
```

### 4.2 パフォーマンス最適化

```typescript
// app/lib/cache/translation-cache.ts
import { unstable_cache } from 'next/cache';

export const getCachedTranslations = unstable_cache(
  async (listingId: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from('listing_translations')
      .select('*')
      .eq('listing_id', listingId);
    return data;
  },
  ['listing-translations'],
  {
    revalidate: 3600, // 1時間キャッシュ
    tags: ['translations']
  }
);
```

### 4.3 テストの実装

```typescript
// __tests__/i18n/translation.test.ts
import { render, screen } from '@testing-library/react';
import { NextIntlProvider } from 'next-intl';
import messages from '@/messages/ja.json';

describe('Translation Tests', () => {
  it('should display Japanese UI elements', () => {
    render(
      <NextIntlProvider locale="ja" messages={messages}>
        <Header />
      </NextIntlProvider>
    );
    
    expect(screen.getByText('リスティング')).toBeInTheDocument();
  });

  it('should switch content language', async () => {
    // テスト実装
  });
});
```

## 移行チェックリスト

### Phase 1 完了条件
- [ ] データベーススキーマ更新完了
- [ ] TypeScript型定義更新完了
- [ ] next-intl基本設定完了
- [ ] ルーティング構造変更完了

### Phase 2 完了条件
- [ ] 全UIコンポーネントの国際化完了
- [ ] 言語切り替えUI実装完了
- [ ] 翻訳ファイル作成完了
- [ ] 既存ページの移行完了

### Phase 3 完了条件
- [ ] 翻訳API統合完了
- [ ] 自動翻訳フロー実装完了
- [ ] コンテンツ言語切り替え実装完了
- [ ] 既存データの翻訳完了

### Phase 4 完了条件
- [ ] SEO最適化実装完了
- [ ] パフォーマンス最適化完了
- [ ] E2Eテスト作成完了
- [ ] 本番環境デプロイ完了

## トラブルシューティング

### よくある問題と解決方法

1. **翻訳が表示されない**
   - translation_queueテーブルを確認
   - 翻訳ジョブのステータスを確認
   - エラーログを確認

2. **言語切り替えが機能しない**
   - middleware.tsの設定を確認
   - next.config.jsの設定を確認
   - ブラウザのキャッシュをクリア

3. **パフォーマンスが遅い**
   - 翻訳のキャッシュを確認
   - データベースインデックスを確認
   - 不要な翻訳APIコールを削減

## 参考資料

- [Next.js App Router Internationalization](https://nextjs.org/docs/app/building-your-application/routing/internationalization)
- [next-intl Documentation](https://next-intl-docs.vercel.app/)
- [Google Cloud Translation API](https://cloud.google.com/translate/docs)
- [DeepL API Documentation](https://www.deepl.com/docs-api)