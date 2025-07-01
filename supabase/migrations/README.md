# Supabase マイグレーション手順

## チャットテーブルの作成

1. Supabaseダッシュボードにログイン
2. SQL Editorを開く
3. `20250101_create_chat_tables.sql`の内容をコピー＆ペースト
4. 実行ボタンをクリック

## 確認事項

マイグレーション実行後、以下を確認してください：

1. **テーブルの作成確認**
   - conversations
   - messages
   - conversation_participants

2. **RLSポリシーの確認**
   - 各テーブルでRLSが有効になっていること
   - ポリシーが正しく適用されていること

3. **Realtime設定の確認**
   - Realtimeタブで上記3つのテーブルが有効になっていること

## 型定義の更新

マイグレーション実行後、以下のコマンドで型定義を更新：

```bash
npx supabase gen types typescript --project-id [YOUR_PROJECT_ID] > types/supabase.ts
```

または、Supabase CLIがインストールされている場合：

```bash
supabase gen types typescript --linked > types/supabase.ts
```