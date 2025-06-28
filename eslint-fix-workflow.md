# ESLint エラー修正ワークフロー

## 修正対象ファイル（エラー数順）

### 1. app/[locale]/listings/[id]/page.tsx ✅ 完了
- [x] 未使用のインポートを削除
- [x] 未使用の変数を削除 (userData)
- [x] 'any' 型を適切な型に置き換え (stationLines, image)
- [x] React Hook の依存関係警告を修正（該当なし）

### 2. app/api/listings/route.ts ✅ 完了
- [x] 未使用のインポートを削除 (createServerClient)
- [x] 未使用の変数を削除 (getStationLocationData関数)
- [x] 'any' 型を適切な型に置き換え (error)

### 3. app/api/listings/search/route.ts ✅ 完了
- [x] 未使用のインポートを削除 (Json)
- [x] 未使用の変数を削除（該当なし）
- [x] 'any' 型を適切な型に置き換え (category, sort, error)

## 修正結果
主要な3つのファイルのESLintエラーを修正完了。
- 未使用のインポート・変数の削除
- 'any' 型を具体的な型に置き換え
- エラーハンドリングの型安全性を向上

## 残りのエラー
他のファイルにも同様のエラーが存在するが、今回の作業範囲外。