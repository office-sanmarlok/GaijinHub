# 翻訳アーキテクチャの比較

## 現在の実装（GitHub Actions直接実行）

```
[新規リスティング] → [Supabase Queue] → [GitHub Actions（定期実行）] → [DeepL API]
```

### メリット
- シンプルで理解しやすい
- Vercelの実行時間制限（10秒）に影響されない
- GitHub Actionsの無料枠が大きい（月2,000分）
- デバッグが容易

### デメリット
- 最大1時間の遅延（スケジュール実行の場合）
- リアルタイム性が低い

## 改善案1: ハイブリッド方式（推奨）

```
[新規リスティング] → [Vercel Webhook] → [GitHub Actions即時起動] → [DeepL API]
                  ↓
            [Supabase Queue]（バックアップ）
```

### 実装方法
1. リスティング作成時にVercel webhookを呼び出す
2. Vercel APIがGitHub Actions workflowを即座にトリガー
3. バックアップとして1時間ごとのスケジュール実行も維持

### メリット
- 即時翻訳が可能
- Vercelの実行時間制限を回避
- 障害に強い（バックアップあり）

## 改善案2: Vercel Edge Functions

```
[新規リスティング] → [Vercel Edge Function] → [DeepL API]
```

### メリット
- 超低遅延
- Edge Functionsは実行時間制限が緩い
- グローバルに分散

### デメリット
- Edge Functionsの制限（メモリ、パッケージサイズ）
- デバッグが難しい

## 推奨構成

**ハイブリッド方式**を推奨します：
1. 即時性が必要な場合はWebhook経由でGitHub Actionsを起動
2. バックアップとして定期実行も維持
3. 将来的にトラフィックが増えたらEdge Functionsに移行

## 実装に必要な変更

1. `app/api/translation/webhook/route.ts` - ✅ 作成済み
2. GitHub Actionsワークフローに`workflow_dispatch`イベントを追加
3. リスティング作成時にwebhookを呼び出すコードを追加