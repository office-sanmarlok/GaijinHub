# ハイブリッド翻訳システムの設定手順

## 必要な設定

### 1. GitHub Personal Access Token の作成

1. GitHub にログイン
2. Settings → Developer settings → Personal access tokens → Tokens (classic)
3. "Generate new token" → "Generate new token (classic)" をクリック
4. 以下の設定で作成：
   - **Note**: GaijinHub Translation Workflow
   - **Expiration**: 90 days（お好みで）
   - **Scopes**: 
     - ✅ `repo` (Full control of private repositories)
     - ✅ `workflow` (Update GitHub Action workflows)
5. "Generate token" をクリック
6. **トークンをコピー**（一度しか表示されない！）

### 2. GitHub Secrets の追加

GitHubリポジトリで以下のSecretsを追加：

| Secret Name | Value | 説明 |
|-------------|-------|------|
| `GH_PERSONAL_TOKEN` | 上記で作成したトークン | GitHub Actions起動用 |
| `WEBHOOK_SECRET` | `bcb5a8688c43eced81892d3e08e96a691ebfff6a25e4206f893c6276f992a984` | Webhook認証用 |

### 3. Vercel 環境変数の追加

Vercelダッシュボードで以下の環境変数を追加：

1. Vercelダッシュボードを開く
2. プロジェクトを選択
3. Settings → Environment Variables
4. 以下を追加：

| Name | Value | Environment |
|------|-------|-------------|
| `GH_PERSONAL_TOKEN` | 上記で作成したトークン | Production |
| `GH_REPO_OWNER` | `office-sanmarlok` | Production |
| `GH_REPO_NAME` | `GaijinHub` | Production |
| `WEBHOOK_SECRET` | `bcb5a8688c43eced81892d3e08e96a691ebfff6a25e4206f893c6276f992a984` | Production |

## 動作の流れ

1. **リスティング作成時**:
   - 翻訳キューに追加
   - Vercel Webhook APIを呼び出し
   - GitHub Actionsを即座にトリガー
   - 数秒で翻訳開始

2. **バックアップ（1時間ごと）**:
   - GitHub Actionsが定期実行
   - キューに残っている項目を処理

## テスト方法

1. 新しいリスティングを作成
2. Vercelのログで「Translation webhook triggered successfully」を確認
3. GitHub Actions タブで「Process Translation Queue」が実行されていることを確認
4. 数秒後、翻訳が完了していることを確認

## セキュリティの注意

- GitHub Personal Access Tokenは絶対に公開しない
- 定期的にトークンを更新する（90日ごと）
- WEBHOOK_SECRETは推測されにくい値を使用