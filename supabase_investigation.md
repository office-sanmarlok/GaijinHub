# Supabase調査結果とユーザー情報取得方法

## 調査結果

### 1. profilesまたはuser_profilesテーブルの存在
- **結果**: 存在しない
- profilesやuser_profilesというテーブルは見つかりませんでした

### 2. auth.usersテーブルからユーザー情報を取得する方法

#### 既存のRPC関数
- **`get_auth_user(user_id uuid)`**: auth.usersからユーザー情報を取得
  - 返す情報: id, email, display_name (raw_user_meta_dataから)
  
- **`get_listing_details(p_listing_id uuid)`**: リスティング詳細とユーザー情報を取得
  - user_info として以下を返す:
    - id
    - email
    - created_at

### 3. listingsテーブルとユーザー情報を結合する方法

#### 現在の構造
- listingsテーブルには`user_id`カラムがあり、auth.users.idを参照
- avatarsテーブルが存在するが、現在データは空
  - user_id (uuid)
  - avatar_path (text)

## auth.usersのメタデータ構造
- **raw_user_meta_data**に含まれる情報:
  - sub: ユーザーID
  - email: メールアドレス
  - display_name: 表示名（ユーザー名）
  - email_verified: メール認証状態
  - phone_verified: 電話番号認証状態

## 実装タスクチェックリスト

### ✅ 1. ユーザー情報取得関数の改善
- [x] `get_auth_user`関数を拡張して、avatarも含めるように修正が必要
- [x] auth.usersのraw_user_meta_dataからdisplay_nameを取得可能

### ✅ 2. リスティング一覧でユーザー情報を取得する方法の実装
- [x] `search_listings`関数を確認 → user_idのみ返している
- [ ] 新しいRPC関数を作成または既存の関数を拡張する必要あり

### □ 3. アバター機能の実装
- [ ] avatarsテーブルは現在空
- [ ] デフォルトアバターの処理方法を決定
- [ ] アバターアップロード機能の実装状況を確認

### □ 4. フロントエンド側の実装
- [ ] ユーザー情報取得のためのSupabaseクライアント関数の実装
- [ ] UIコンポーネントでの表示方法の実装

## 推奨される実装方法

### オプション1: 新しいRPC関数を作成
`search_listings_with_users`のような関数を作成し、ユーザー情報も含めて返す

### オプション2: 既存の`search_listings`関数を拡張
既存の関数にユーザー情報を追加（後方互換性に注意）

### オプション3: 別途ユーザー情報取得API
リスティング取得後、別途ユーザー情報を取得（N+1問題に注意）