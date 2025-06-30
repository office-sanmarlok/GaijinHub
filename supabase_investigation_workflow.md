# Supabase調査ワークフロー

## 調査結果サマリー

### 問題点
- 英語で投稿しても、original_languageが'ja'として保存されている
- 最新の投稿例：
  - "this is a test" (ID: d54b009f-5cbc-46c0-ba05-b8ed74407c26) → original_language: 'ja'
  - "this is a test posting" (ID: 717c4173-2559-4c80-b309-57f562c82f32) → original_language: 'ja'

### 調査内容

- [x] プロジェクトIDの確認
  - GaijinHub: sidtuvasgtmodtrjmhbw
- [x] 最新投稿データの確認
  - 英語投稿もoriginal_languageが'ja'になっている
- [x] listingsテーブル定義の確認
  - original_languageカラム: varchar型、デフォルト値なし、NULL許可
- [x] トリガーの確認
  - original_languageを設定するトリガーは存在しない
- [x] RLSポリシーの確認
  - original_languageを設定するポリシーは存在しない

## 原因分析

original_languageが常に'ja'になる原因は、Supabase側（データベース側）ではなく、フロントエンド側のコードにある。

### 根本原因
言語検出のフォールバックロジックで、デフォルト値として'ja'が設定されている箇所が複数ある：

1. `/app/lib/language-detection.ts` (31行目)
   - VSCode言語検出のマッピングにない言語コードの場合、デフォルトで'ja'を返す

2. `/app/lib/translation.ts` (16行目)
   - DeepL言語検出が失敗した場合、デフォルトで'ja'を返す

3. `/app/lib/deepl/client.ts` (110行目)
   - DeepLの言語コードマッピングにない場合、デフォルトで'ja'を返す

## 次のステップ

- [x] フロントエンドコードでoriginal_languageの設定ロジックを確認
- [x] 投稿作成時のAPIリクエストペイロードを確認
- [x] 言語検出ロジックの実装状況を確認
- [ ] デフォルト言語の設定を修正
- [ ] 英語での投稿が正しく'en'として保存されることを確認