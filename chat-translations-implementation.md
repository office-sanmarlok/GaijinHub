# チャット機能翻訳追加作業手順書

## 作業内容
messages配下の各言語ファイルにチャット機能用の翻訳を追加する

## チェックリスト

### 1. 現在のファイル構造確認
- [x] messages ディレクトリの存在確認
- [x] 各言語ファイルの存在確認（ja.json, en.json, ko.json, zh-CN.json, zh-TW.json）

### 2. 日本語翻訳追加（ja.json）
- [x] ja.jsonファイルの読み込み
- [x] chatセクションの追加
- [x] 以下の翻訳を追加:
  - chat.user: "ユーザー"
  - chat.unknownUser: "不明なユーザー"
  - chat.noMessages: "メッセージがありません"
  - chat.typeMessage: "メッセージを入力..."
  - chat.send: "送信"
  - chat.errorLoadingMessages: "メッセージの読み込みに失敗しました"
  - chat.errorSendingMessage: "メッセージの送信に失敗しました"
  - chat.pleaseTryAgain: "もう一度お試しください"
  - chat.edited: "編集済み"

### 3. 英語翻訳追加（en.json）
- [x] en.jsonファイルの読み込み
- [x] chatセクションの追加
- [x] 英語版の翻訳を追加

### 4. 韓国語翻訳追加（ko.json）
- [x] ko.jsonファイルの読み込み
- [x] chatセクションの追加
- [x] 韓国語版の翻訳を追加

### 5. 中国語簡体字翻訳追加（zh-CN.json）
- [x] zh-CN.jsonファイルの読み込み
- [x] chatセクションの追加
- [x] 中国語簡体字版の翻訳を追加

### 6. 中国語繁体字翻訳追加（zh-TW.json）
- [x] zh-TW.jsonファイルの読み込み
- [x] chatセクションの追加
- [x] 中国語繁体字版の翻訳を追加

### 7. 最終確認
- [x] 全ファイルの構文エラーチェック
- [x] 翻訳キーの一貫性確認