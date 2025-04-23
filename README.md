# GaijinHub

在日外国人コミュニティのためのプラットフォーム

## 認証とユーザーデータの取り扱い

### サーバーサイドでのユーザー認証

サーバーコンポーネントでは、`createServerComponentClient`を使用して認証状態を取得します：

```typescript
const cookieStore = cookies()
const supabase = createServerComponentClient({ cookies: () => cookieStore })

// ユーザーデータの取得（認証済みかの確認）
const { data: { user } } = await supabase.auth.getUser()
```

### クライアントサイドでのユーザー状態管理

クライアントコンポーネントでは、`createClient`を使用して認証状態を管理します：

```typescript
const supabase = createClient()

// 初期ユーザーデータの取得
const { data: { user } } = await supabase.auth.getUser()

// 認証状態の変更を監視
supabase.auth.onAuthStateChange((event, session) => {
  if (session?.user) {
    // ユーザーデータの更新処理
  }
})
```

### セキュリティに関する注意点

1. サーバーコンポーネントでは必ず`getUser()`を使用し、認証済みのユーザーデータを取得
2. クライアントコンポーネントでは認証状態の変更を適切に監視
3. ユーザーメタデータ（表示名など）は`user.user_metadata`から安全に取得

### ユーザーメタデータの更新

表示名などのメタデータは以下のように更新します：

```typescript
const { error } = await supabase.auth.updateUser({
  data: { display_name: 'New Name' }
})
```

## セットアップ

1. 依存パッケージのインストール:

```bash
npm install
```

2. 環境変数の設定:

`.env.local`ファイルを作成し、以下の変数を設定:

```
NEXT_PUBLIC_SUPABASE_URL=https://<YOUR-PROJECT>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<YOUR_ANON_KEY>
SUPABASE_SERVICE_ROLE_KEY=<YOUR_SERVICE_ROLE_KEY>
```

3. 開発サーバーの起動:

```bash
npm run dev
```

4. Supabaseのセットアップ:

**アバターストレージとテーブルの設定:**

1. Supabaseダッシュボードで以下のテーブルを作成:

```sql
CREATE TABLE public.avatars (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  avatar_path text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

-- RLSポリシーを設定
ALTER TABLE public.avatars ENABLE ROW LEVEL SECURITY;

-- 自分のアバターのみ見ることができる
CREATE POLICY "ユーザーは自分のアバターを見ることができる" ON public.avatars
  FOR SELECT USING (auth.uid() = user_id);

-- 自分のアバターのみ更新できる
CREATE POLICY "ユーザーは自分のアバターを追加できる" ON public.avatars
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ユーザーは自分のアバターを更新できる" ON public.avatars
  FOR UPDATE USING (auth.uid() = user_id);

-- 自分のアバターのみ削除できる
CREATE POLICY "ユーザーは自分のアバターを削除できる" ON public.avatars
  FOR DELETE USING (auth.uid() = user_id);
```

2. Storageでアバター用のバケットを作成:
   - Storageセクションで「New Bucket」をクリック
   - バケット名を「avatars」に設定
   - 「Make bucket public」にチェック
   - 作成ボタンをクリック

**注意事項:**
- アバターアップロード機能を使用するには、上記の設定が必要です
- アバターストレージには画像ファイルのみを許可するRLSポリシーを設定してください

## 機能

- 認証（サインアップ/ログイン）
- リスティングの作成、閲覧
- カテゴリー別フィルタリング
- 位置情報に基づく検索
- 多言語対応（日本語、英語、中国語）

## 使用技術

- Next.js 14 (App Router)
- TypeScript
- Supabase
- Shadcn UI
- Tailwind CSS

## Project Structure

- `app/` - Next.js app directory
  - `components/` - Reusable UI components
  - `listings/` - Listings page and related components
  - `providers/` - Context providers
- `public/` - Static assets

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License
