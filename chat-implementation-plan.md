# GaijinHub チャット機能実装計画書

## 概要
GaijinHubに無料・低コストでユーザー間のリアルタイムチャット機能を実装する計画書です。
既存のSupabaseインフラを最大限活用し、追加コストを最小限に抑えます。

## 技術選定

### 選定技術
- **リアルタイム通信**: Supabase Realtime（無料枠内）
- **データベース**: Supabase PostgreSQL（既存）
- **認証**: Supabase Auth（既存）
- **UI**: 既存のコンポーネントライブラリ（shadcn/ui）

### コスト分析
- Supabase無料プランの制限:
  - Realtime接続: 200同時接続
  - データベース: 500MB
  - 帯域幅: 5GB/月
- 小〜中規模のユーザーベースであれば無料枠内で運用可能

## 実装手順チェックリスト

### Phase 1: データベース設計とセットアップ
- [ ] チャット関連テーブルの設計
  - [ ] `conversations`テーブル（会話情報）
  - [ ] `messages`テーブル（メッセージ）
  - [ ] `conversation_participants`テーブル（参加者）
- [ ] Row Level Security (RLS)ポリシーの設定
- [ ] インデックスの作成
- [ ] マイグレーションファイルの作成

### Phase 2: バックエンド実装
- [ ] Supabase Realtimeの設定
  - [ ] Realtimeチャンネルの設定
  - [ ] メッセージ購読の実装
- [ ] API関数の実装
  - [ ] 会話作成
  - [ ] メッセージ送信
  - [ ] メッセージ履歴取得
  - [ ] 既読状態更新
- [ ] 型定義の生成と更新

### Phase 3: フロントエンド実装
- [ ] チャットUIコンポーネント
  - [ ] チャットリスト画面
  - [ ] チャット画面（メッセージ表示・入力）
  - [ ] ユーザー選択モーダル
- [ ] リアルタイム機能の統合
  - [ ] 新着メッセージのリアルタイム受信
  - [ ] 既読状態のリアルタイム更新
  - [ ] オンライン状態表示（オプション）
- [ ] 国際化対応（既存のnext-intlを使用）

### Phase 4: 機能拡張
- [ ] 既読機能
  - [ ] 既読状態の追跡
  - [ ] 既読表示UI
- [ ] 通知機能
  - [ ] ブラウザ通知（Notification API）
  - [ ] アプリ内通知バッジ
- [ ] メッセージ検索機能
- [ ] 画像送信機能（既存のアップロード機能を活用）

### Phase 5: テストと最適化
- [ ] 単体テスト作成
- [ ] 統合テスト作成
- [ ] パフォーマンス最適化
  - [ ] メッセージのページネーション
  - [ ] 無限スクロール実装
  - [ ] キャッシュ戦略
- [ ] セキュリティ監査

## データベーススキーマ設計

### conversations テーブル
```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_at TIMESTAMP WITH TIME ZONE,
  type TEXT DEFAULT 'direct' -- 'direct' or 'group'
);
```

### messages テーブル
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_edited BOOLEAN DEFAULT FALSE,
  reply_to UUID REFERENCES messages(id)
);
```

### conversation_participants テーブル
```sql
CREATE TABLE conversation_participants (
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_read_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  PRIMARY KEY (conversation_id, user_id)
);
```

## 実装優先順位

1. **必須機能**（MVP）
   - 1対1のダイレクトメッセージ
   - リアルタイムメッセージ送受信
   - メッセージ履歴表示
   - 基本的なUI

2. **重要機能**
   - 既読機能
   - 通知機能
   - メッセージ検索

3. **追加機能**（将来的な拡張）
   - グループチャット
   - 画像・ファイル送信
   - メッセージの編集・削除
   - リアクション機能

## セキュリティ考慮事項

- Row Level Security (RLS)による適切なアクセス制御
- XSS対策（React標準のエスケープ処理）
- SQLインジェクション対策（Supabaseのプリペアドステートメント）
- レート制限の実装
- メッセージの暗号化（将来的な検討事項）

## パフォーマンス最適化

- メッセージの遅延読み込み（初期表示は最新50件程度）
- 仮想スクロールの実装（大量メッセージ対応）
- 適切なインデックスの設定
- Supabase Realtimeの接続管理（不要時は切断）

## 監視とメンテナンス

- エラーログの収集
- パフォーマンスメトリクスの監視
- Supabaseダッシュボードでの使用量監視
- 定期的なデータベースのバックアップ

## 成功指標

- レスポンスタイム: メッセージ送信から表示まで1秒以内
- 同時接続ユーザー数: 100人以上対応
- メッセージ配信成功率: 99.9%以上
- ユーザー満足度: チャット機能の利用率向上