# ListingCard型からListing型への置換作業手順書

## 作業概要
プロジェクト内でListingCard型（ListingCardDataやListingCardProps以外）への参照を探して、すべてListing型に置換する。

## 対象ファイル
- [ ] app/api/listings/search/route.ts
- [ ] app/[locale]/account/favorites/page.tsx
- [ ] app/components/search/ListingGrid.tsx

## 作業手順

### 1. 各ファイルの現状確認
- [x] app/api/listings/search/route.tsの内容を確認
- [x] app/[locale]/account/favorites/page.tsxの内容を確認
- [x] app/components/search/ListingGrid.tsxの内容を確認

### 2. ListingCard型の参照箇所を特定
- [x] 各ファイルでListingCard型の使用箇所を特定
- [x] ListingCardPropsへの参照は除外することを確認

#### 特定された参照箇所：
- app/api/listings/search/route.ts
  - 3行目: import文
  - 167行目: 型注釈
- app/[locale]/account/favorites/page.tsx
  - 12行目: import文
  - 21行目: useState型注釈
  - 68行目: 型注釈
- app/components/search/ListingGrid.tsx
  - 7行目: import文
  - 10行目: interface内の型定義

### 3. 型の置換実施
- [x] app/api/listings/search/route.tsでListingCard型をListing型に置換
- [x] app/[locale]/account/favorites/page.tsxでListingCard型をListing型に置換
- [x] app/components/search/ListingGrid.tsxでListingCard型をListing型に置換

### 4. インポート文の修正
- [x] 不要になったListingCard型のインポートを削除
- [x] 必要に応じてListing型のインポートを追加（すべてのファイルでインポート文を適切に更新済み）

### 5. 動作確認
- [x] TypeScriptのコンパイルエラーがないことを確認

## 作業完了
すべてのファイルでListingCard型からListing型への置換が正常に完了しました。