# Supabase チャット機能実装手順

## 1. データベースマイグレーション実行手順

### Supabaseダッシュボードでの実行方法

1. [Supabaseダッシュボード](https://supabase.com/dashboard/project/sidtuvasgtmodtrjmhbw)にアクセス
2. 左側メニューから「SQL Editor」をクリック
3. 新しいクエリを作成
4. `/supabase/migrations/20250101_create_chat_tables.sql`の内容をコピー＆ペースト
5. 「Run」ボタンをクリックして実行

### 実行確認

実行後、以下を確認してください：

1. **Table Editor**で以下のテーブルが作成されていること：
   - `conversations`
   - `messages`
   - `conversation_participants`

2. **Authentication** → **Policies**で各テーブルのRLSポリシーが設定されていること

3. **Realtime**設定で上記3テーブルが有効になっていること

## 2. 型定義の更新

マイグレーション実行後、以下のコマンドで型定義を更新：

```bash
SUPABASE_ACCESS_TOKEN=sbp_c0048143babf251908d46f4f98b755a45b7be2b2 \
npx supabase gen types typescript --project-id sidtuvasgtmodtrjmhbw > types/supabase.ts
```

## 3. 実装済みファイル

- ✅ `/lib/chat/types.ts` - チャット機能の型定義
- ✅ `/lib/chat/client.ts` - チャットAPIクライアント
- ✅ `/supabase/migrations/20250101_create_chat_tables.sql` - データベーススキーマ

## チャット機能実装チェックリスト

### □ 1. データベーススキーマ設計
- [ ] チャット関連テーブルの設計
  - [ ] conversations（会話）テーブル
  - [ ] messages（メッセージ）テーブル
  - [ ] conversation_participants（参加者）テーブル
- [ ] 必要なインデックスの設計
- [ ] RLSポリシーの設計

### □ 2. Supabaseダッシュボードでのテーブル作成
- [ ] conversationsテーブルの作成
  ```sql
  -- 会話テーブル
  CREATE TABLE conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  ```
- [ ] messagesテーブルの作成
  ```sql
  -- メッセージテーブル
  CREATE TABLE messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  ```
- [ ] conversation_participantsテーブルの作成
  ```sql
  -- 会話参加者テーブル
  CREATE TABLE conversation_participants (
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    last_read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (conversation_id, user_id)
  );
  ```

### □ 3. RLSポリシーの実装
- [ ] conversationsテーブルのRLS
  - [ ] 参加者のみ読み取り可能
  - [ ] リスティング所有者と投稿への問い合わせ者のみ作成可能
- [ ] messagesテーブルのRLS
  - [ ] 会話参加者のみ読み書き可能
- [ ] conversation_participantsテーブルのRLS
  - [ ] 参加者のみ読み取り可能

### □ 4. RPC関数の作成
- [ ] create_conversation: 新規会話作成
- [ ] send_message: メッセージ送信
- [ ] get_conversations: ユーザーの会話一覧取得
- [ ] get_messages: 会話のメッセージ取得
- [ ] mark_messages_as_read: メッセージ既読処理

### □ 5. 型定義の更新
- [ ] `/types/supabase.ts`に新しいテーブルの型を追加
- [ ] チャット関連の型インターフェースを定義

### □ 6. APIエンドポイントの実装
- [ ] `/api/chat/conversations/route.ts`: 会話一覧取得
- [ ] `/api/chat/conversations/[id]/route.ts`: 特定の会話取得
- [ ] `/api/chat/conversations/create/route.ts`: 会話作成
- [ ] `/api/chat/messages/route.ts`: メッセージ送信
- [ ] `/api/chat/messages/[conversationId]/route.ts`: メッセージ取得

### □ 7. リアルタイム機能の実装
- [ ] Supabase Realtimeの設定
- [ ] メッセージのリアルタイム受信
- [ ] 既読状態のリアルタイム更新

### □ 8. フロントエンドコンポーネントの実装
- [ ] ChatList: 会話一覧コンポーネント
- [ ] ChatWindow: チャットウィンドウコンポーネント
- [ ] MessageList: メッセージ一覧コンポーネント
- [ ] MessageInput: メッセージ入力コンポーネント
- [ ] ChatButton: リスティング詳細ページのチャットボタン

### □ 9. 通知機能の実装（オプション）
- [ ] 新着メッセージの通知
- [ ] メール通知（オプション）
- [ ] ブラウザ通知（オプション）

### □ 10. テストとデバッグ
- [ ] 会話作成のテスト
- [ ] メッセージ送受信のテスト
- [ ] リアルタイム機能のテスト
- [ ] 権限チェックのテスト

## 実装順序

1. **データベース構築** (Steps 1-3)
2. **バックエンド実装** (Steps 4-6)
3. **リアルタイム機能** (Step 7)
4. **フロントエンド実装** (Step 8)
5. **テスト** (Step 10)

## 注意事項

- Supabaseのマイグレーションファイルは見つからなかったため、Supabaseダッシュボードで直接テーブルを作成する必要がある
- RLSポリシーは慎重に設計し、セキュリティを確保する
- リアルタイム機能は、Supabaseの設定で有効化する必要がある