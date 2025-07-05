# Container クラス置き換え作業手順書

## 目的
以下のファイルで`container mx-auto`を`container-responsive`に置き換える

## 対象ファイル
- [x] app/[locale]/chat/[id]/page.tsx
- [x] app/[locale]/chat/page.tsx
- [x] app/components/listings/ListingDetailClient.tsx
- [x] app/[locale]/account/favorites/page.tsx
- [x] app/[locale]/listings/page.tsx
- [x] app/[locale]/signup/page.tsx
- [x] app/[locale]/account/my-listings/page.tsx
- [x] app/[locale]/login/page.tsx

## 作業内容
1. 各ファイルを読み込む
2. `container mx-auto`を`container-responsive`に置き換える
3. `container mx-auto px-4`のようにpaddingが含まれている場合も`container-responsive`のみに置き換える（container-responsiveクラスには既にpaddingが含まれているため）

## 進捗
- [x] ファイルの読み込み開始
- [x] 置き換え作業実施
- [x] 作業完了確認

## 実施した変更内容
すべてのファイルで以下の置き換えを実施しました：
- `container mx-auto px-4` → `container-responsive` （px-4は削除、container-responsiveに既に含まれているため）
- `container mx-auto` → `container-responsive`