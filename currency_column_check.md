# Listingsテーブル - Currencyカラム確認作業

## 確認結果

### Listingsテーブルのスキーマ構造

- [ ] スキーマ確認完了

現在のlistingsテーブルのカラム一覧：
- id (uuid) - 主キー、自動生成
- user_id (uuid) - ユーザーID、必須
- category (text) - カテゴリー、必須
- title (varchar) - タイトル、必須
- body (text) - 本文、必須
- price (numeric) - 価格、NULL可
- lat (double precision) - 緯度、NULL可
- lng (double precision) - 経度、NULL可
- is_city_only (boolean) - 市のみ表示フラグ、デフォルト: false
- rep_image_url (text) - 代表画像URL、NULL可
- created_at (timestamp with time zone) - 作成日時、デフォルト: now()
- muni_id (varchar) - 市区町村ID、NULL可
- station_id (varchar) - 駅ID、NULL可
- has_location (boolean) - 位置情報有無、デフォルト: true
- point (USER-DEFINED) - 地理空間データ、NULL可
- station_g_cd (varchar) - 駅グループコード、NULL可
- original_language (varchar) - 元の言語、デフォルト: 'ja'
- pref_id (varchar) - 都道府県ID、NULL可

### 確認結果サマリー

- [x] **currencyカラムは存在しません**
- [x] テスト用リスティング作成に必要な必須カラムを特定：
  - user_id (uuid) - 必須
  - category (text) - 必須
  - title (varchar) - 必須
  - body (text) - 必須

## 推奨事項

1. 価格情報は `price` カラム（numeric型）に保存されている
2. 通貨情報を保存する場合は、新しく `currency` カラムを追加するか、価格表示時に別の方法で通貨を管理する必要がある
3. テスト用リスティング作成時は、最低限以下の値を設定する必要がある：
   - user_id（有効なユーザーIDが必要）
   - category
   - title
   - body