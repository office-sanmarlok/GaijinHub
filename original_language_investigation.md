# オリジナル言語表示問題調査

## 調査手順

### 1. データベース確認
- [x] Supabaseのlistingsテーブルでoriginal_languageカラムの存在確認
- [x] original_languageカラムのデータ型確認
- [x] 実際のデータにoriginal_language値が入っているか確認

### 2. search_listings関数の確認
- [x] search_listings関数の定義を確認
- [x] original_languageがSELECT句に含まれているか確認
- [x] 関数の戻り値にoriginal_languageが含まれているか確認

### 3. APIレスポンスの確認
- [x] フロントエンドのAPI呼び出し箇所を特定
- [x] 実際のAPIレスポンスにoriginal_languageが含まれているか確認
- [x] コンポーネントでoriginal_languageが正しく表示されているか確認

### 4. 問題の特定と修正
- [x] 問題箇所を特定
- [x] 必要な修正を実施
- [ ] 動作確認

## 調査結果

### データベース構造
- listingsテーブルにoriginal_languageカラムが存在（VARCHAR型、デフォルト値: 'ja'）
- 実際のデータも正しく格納されている（例: 'ja', 'en'）

### search_listings関数
- 関数の戻り値にoriginal_languageが含まれている（29行目）
- SELECT句でも正しく選択されている（165行目）

### APIレスポンス
- `/api/listings/search/route.ts`でoriginal_languageを正しく処理（177行目）
- ListingCardData型にもoriginal_languageが定義されている（53行目）

### 問題と解決策
**問題の原因：**
1. LanguageBadgeコンポーネントがデフォルトで日本語（'ja'）の場合は表示しない仕様になっている
   - `if (!language || (!showDefault && language === 'ja')) { return null; }`（27行目）
   - デフォルトでshowDefault=falseのため、日本語のリスティングではバッジが表示されない

2. ListingCardコンポーネントでLanguageBadgeを使用する際、showDefaultプロパティを渡していない
   - `<LanguageBadge language={listing.original_language} />`（91行目）

**解決策：**
ListingCardコンポーネントでLanguageBadgeを使用する際に、`showDefault={true}`を追加する必要がある。

### 実施した修正
1. `/app/components/listings/ListingCard.tsx` (91行目)
   - 変更前: `<LanguageBadge language={listing.original_language} />`
   - 変更後: `<LanguageBadge language={listing.original_language} showDefault={true} />`

2. `/app/components/listings/ListingDetailClient.tsx` (200行目)
   - 変更前: `<LanguageBadge language={listing.original_language} />`
   - 変更後: `<LanguageBadge language={listing.original_language} showDefault={true} />`

これにより、日本語のリスティングでも「日本語」バッジが表示されるようになります。