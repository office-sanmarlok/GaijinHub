# 翻訳機能デプロイチェックリスト

## 前提条件
- [ ] GitHub ActionsワークフローがGitHubにプッシュ済み
- [ ] Vercel APIエンドポイント（`/api/translation/process`）が実装済み
- [ ] Supabaseの翻訳関連テーブルとRPC関数が作成済み

## 1. GitHub Secretsの設定

GitHub リポジトリの Settings > Secrets and variables > Actions で以下を設定：

- [ ] `SUPABASE_URL`: `https://sidtuvasgtmodtrjmhbw.supabase.co`
- [ ] `SUPABASE_ANON_KEY`: Supabaseのanonキー
- [ ] `SUPABASE_SERVICE_ROLE_KEY`: Supabaseのservice roleキー
- [ ] `DEEPL_API_KEY`: DeepL APIキー
- [ ] `WEBHOOK_SECRET`: Webhook認証用シークレット
- [ ] `VERCEL_WEBHOOK_URL`: `https://gaijin-hub.vercel.app/api/translation/process`

## 2. Vercel環境変数の確認

Vercelダッシュボードで以下の環境変数が設定されていることを確認：

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `DEEPL_API_KEY`
- [ ] `WEBHOOK_SECRET`（GitHub Secretsと同じ値）

## 3. デプロイ前の確認

- [ ] ローカルでビルドが成功することを確認
  ```bash
  npm run build
  ```
- [ ] TypeScriptエラーがないことを確認
- [ ] ESLintエラーがないことを確認

## 4. デプロイ手順

1. [ ] mainブランチにマージ（またはi18nブランチをVercelに接続）
2. [ ] Vercelの自動デプロイを確認
3. [ ] デプロイ完了後、Vercelのログでエラーがないか確認

## 5. 動作確認手順

### 5.1 手動でGitHub Actionsをトリガー
1. [ ] GitHubリポジトリのActions タブを開く
2. [ ] "Process Translation Queue"ワークフローを選択
3. [ ] "Run workflow"ボタンをクリック
4. [ ] 実行結果を確認（成功/失敗）

### 5.2 翻訳キューの確認
1. [ ] Supabaseダッシュボードで`translation_queue`テーブルを確認
2. [ ] statusが`pending`のレコードがあることを確認
3. [ ] GitHub Actions実行後、statusが`completed`に変わることを確認

### 5.3 翻訳結果の確認
1. [ ] `listing_translations`テーブルに翻訳データが保存されていることを確認
2. [ ] 各言語（en, zh-CN, zh-TW, ko）の翻訳が存在することを確認

### 5.4 エンドツーエンドテスト
1. [ ] 本番サイトで新規リスティングを投稿
2. [ ] `translation_queue`に新しいレコードが追加されることを確認
3. [ ] 1時間以内（または手動実行）で翻訳が完了することを確認
4. [ ] サイト上で言語を切り替えて翻訳が表示されることを確認

## 6. トラブルシューティング

### GitHub Actions が失敗する場合
- [ ] GitHub Secretsが正しく設定されているか確認
- [ ] Vercel APIエンドポイントが正しいか確認
- [ ] WEBHOOK_SECRETがGitHubとVercelで一致しているか確認

### 翻訳が実行されない場合
- [ ] Supabaseの`get_pending_translations` RPC関数が存在するか確認
- [ ] DeepL APIキーが有効か確認
- [ ] Vercelのログでエラーを確認

### 翻訳結果が保存されない場合
- [ ] `listing_translations`テーブルの権限設定を確認
- [ ] SUPABASE_SERVICE_ROLE_KEYが正しいか確認

## 7. モニタリング

- [ ] GitHub Actionsの実行履歴を定期的に確認
- [ ] Vercelのログでエラーがないか監視
- [ ] Supabaseの`translation_queue`でfailedステータスのレコードを確認
- [ ] DeepL APIの使用量を確認（月間制限に注意）