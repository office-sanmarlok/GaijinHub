# GitHub Secrets設定手順

GitHub Actionsで翻訳処理を実行するために、以下のSecretsを設定する必要があります。

## 設定手順

1. GitHubリポジトリページを開く
2. Settings → Secrets and variables → Actions に移動
3. "New repository secret" をクリック
4. 以下の各Secretを追加：

### 必要なSecrets

| Name | Value |
|------|-------|
| NEXT_PUBLIC_SUPABASE_URL | https://sidtuvasgtmodtrjmhbw.supabase.co |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpZHR1dmFzZ3Rtb2R0cmptaGJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUzMjYyMTMsImV4cCI6MjA2MDkwMjIxM30.sYUfcPygj-LhT5KbwwFYqAndtErnyqY4QScRn9d76UU |
| SUPABASE_SERVICE_ROLE_KEY | eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpZHR1dmFzZ3Rtb2R0cmptaGJ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTMyNjIxMywiZXhwIjoyMDYwOTAyMjEzfQ.qrHez-YwVJb3QeoRcDMg8O-SlsJqjd6h05KerEBZAI0 |
| DEEPL_API_KEY | 723ca00b-7f56-46eb-8f99-0fecd5633877 |

## 確認方法

1. Actions タブに移動
2. "Process Translation Queue" ワークフローを選択
3. "Run workflow" をクリックして手動実行
4. 実行結果を確認

## 注意事項

- SERVICE_ROLE_KEYは特に重要なので、絶対に公開しないでください
- これらの値は`.env.local`から取得したものです
- GitHub Secretsに設定すると、値は暗号化されて保存されます