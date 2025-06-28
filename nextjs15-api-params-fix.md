# Next.js 15 API Route Params型修正作業

## 作業概要
Next.js 15互換性のため、APIルートのparams型を`Promise<{ ... }>`パターンに修正する。

## 対象ファイル
- [ ] `/app/api/location/lines/[companyId]/route.ts`
- [ ] `/app/api/location/municipalities/[prefId]/route.ts`
- [ ] `/app/api/location/stations/[lineId]/route.ts`

## 修正内容
各ファイルで以下の修正を行う：
1. params型を `{ params: { paramName: string } }` から `{ params: Promise<{ paramName: string }> }` に変更
2. paramsアクセス時に `await` を追加

## 作業手順

### 1. `/app/api/location/lines/[companyId]/route.ts`の修正
- [x] ファイルの内容を確認
- [x] params型を `Promise<{ companyId: string }>` に変更
- [x] paramsアクセス時に `await` を追加
- [ ] 修正をコミット

### 2. `/app/api/location/municipalities/[prefId]/route.ts`の修正
- [x] ファイルの内容を確認
- [x] params型を `Promise<{ prefId: string }>` に変更
- [x] paramsアクセス時に `await` を追加
- [ ] 修正をコミット

### 3. `/app/api/location/stations/[lineId]/route.ts`の修正
- [x] ファイルの内容を確認
- [x] params型を `Promise<{ lineId: string }>` に変更
- [x] paramsアクセス時に `await` を追加
- [ ] 修正をコミット

### 4. 最終確認
- [x] すべてのファイルが正しく修正されたことを確認
- [x] TypeScriptのエラーがないことを確認（params型関連のエラーなし）