# GaijinHub プロジェクト構造調査結果

## 1. 技術スタック

### フレームワーク
- **Next.js 15.3.1** - Reactベースのフルスタックフレームワーク
- **React 19.0.0** - UIライブラリ
- **TypeScript 5.8.3** - 型安全な開発

### データベース・バックエンド
- **Supabase** - PostgreSQLベースのBaaS
  - `@supabase/supabase-js ^2.49.4`
  - `@supabase/auth-helpers-nextjs ^0.10.0`
  - `@supabase/ssr ^0.6.1`

### UIコンポーネント
- **Radix UI** - アクセシビリティに優れたコンポーネント
- **Tailwind CSS 4** - ユーティリティファーストCSSフレームワーク
- **shadcn/ui** - Radix UIベースのコンポーネントライブラリ

### 国際化
- **next-intl ^4.0.3** - 多言語対応

### その他の主要ライブラリ
- **react-hook-form** - フォーム管理
- **zod** - スキーマバリデーション
- **deepl-node** - 翻訳API
- **leaflet** - 地図表示

## 2. データベース構造

### 主要テーブル
1. **listings** - 投稿情報
2. **listing_translations** - 投稿の翻訳
3. **favorites** - お気に入り
4. **images** - 画像
5. **avatars** - ユーザーアバター
6. **user_preferences** - ユーザー設定
7. **prefectures** - 都道府県
8. **municipalities** - 市区町村
9. **stations** - 駅情報
10. **lines** - 路線情報

### ユーザー関連
- Supabase Authを使用してユーザー認証を管理
- avatarsテーブルでアバター画像を管理
- user_preferencesテーブルで言語設定を管理

## 3. 認証システム

### 実装方法
- **Supabase Auth**を使用
- メール/パスワードによる認証
- クライアントサイドとサーバーサイドで異なるクライアントを使用

### 認証フロー
1. サインアップ: メール確認付き
2. ログイン: メール/パスワード
3. セッション管理: Cookieベース

### 保護されたルート
- `/account` - アカウント設定
- `/listings/new` - 新規投稿作成

## 4. プロジェクト構造

### ディレクトリ構成
```
app/
├── [locale]/          # 多言語対応ルート
│   ├── account/       # アカウント管理
│   ├── listings/      # 投稿関連
│   ├── login/         # ログイン
│   └── signup/        # サインアップ
├── api/               # APIルート
├── components/        # UIコンポーネント
├── lib/               # ユーティリティ
│   ├── supabase/      # Supabaseクライアント
│   └── translation.ts # 翻訳関連
└── types/             # TypeScript型定義
```

## 5. 環境変数

必要な環境変数:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase公開キー
- DeepL API関連の設定

## 6. 特徴的な機能

1. **多言語対応** - ja, en, ko, zh-CN, zh-TW
2. **自動翻訳** - DeepL APIを使用
3. **位置情報** - 駅・市区町村ベースの検索
4. **画像アップロード** - Supabase Storage使用
5. **お気に入り機能**
6. **リアルタイム翻訳キュー**

## 7. 認証関連のファイル

### クライアントサイド
- `/app/lib/supabase/client.ts` - ブラウザ用Supabaseクライアント

### サーバーサイド
- `/app/lib/supabase/server.ts` - サーバー用Supabaseクライアント

### 認証ページ
- `/app/[locale]/login/page.tsx` - ログインページ
- `/app/[locale]/signup/page.tsx` - サインアップページ
- `/app/[locale]/account/page.tsx` - アカウント設定ページ

### ミドルウェア
- `/middleware.ts` - 認証チェックとルート保護