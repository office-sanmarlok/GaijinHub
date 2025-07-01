# チャット機能の追加マイグレーション

## 実行が必要なSQL

Supabaseダッシュボードで以下のSQLを実行してください：

### 1. ユーザー情報取得関数（オプション）

```sql
-- Function to get public user information
CREATE OR REPLACE FUNCTION public.get_user_public_info(p_user_id UUID)
RETURNS TABLE(
  id UUID,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'display_name', '')::TEXT as display_name,
    COALESCE(a.avatar_path, '')::TEXT as avatar_url
  FROM auth.users u
  LEFT JOIN public.avatars a ON a.user_id = u.id::TEXT
  WHERE u.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_public_info(UUID) TO authenticated;
```

## 動作確認

1. **チャット開始**: 投稿詳細ページで「チャットを開始」ボタンをクリック
2. **メッセージ送信**: チャット画面でメッセージを送信
3. **チャット一覧**: ヘッダーの「チャット」リンクから会話一覧を確認

## トラブルシューティング

### エラー: "Failed to load conversations"
- まだ会話が存在しない場合は正常です
- 投稿詳細ページから「チャットを開始」してください

### エラー: "User not authenticated"
- ログインが必要です
- ログイン後に再度お試しください

### その他のエラー
- ブラウザの開発者コンソールでエラーの詳細を確認
- Supabaseダッシュボードでテーブルとポリシーを確認