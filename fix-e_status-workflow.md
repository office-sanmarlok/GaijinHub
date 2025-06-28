# e_status フィールドの型修正ワークフロー

## 概要
`e_status` フィールドが文字列型を期待しているのに、数値の `0` を渡している箇所を修正する。

## 修正対象ファイル
- [x] `/home/seito_nakagane/project-wsl/GaijinHub/app/api/location/stations/[lineId]/route.ts` - 47行目
- [x] `/home/seito_nakagane/project-wsl/GaijinHub/app/api/location/stations/route.ts` - 54行目

## 修正内容
`.eq('e_status', 0)` → `.eq('e_status', '0')` に変更

## 作業手順
1. [x] 各ファイルで該当箇所を確認
2. [x] 数値の `0` を文字列の `'0'` に修正
3. [ ] 修正後の動作確認（型エラーが解消されることを確認）