# Git Worktree ブランチマージ手順書

## 概要
git worktreeで管理している全featureブランチをmainブランチにマージする作業手順

## 前提条件
- [x] 各worktreeの変更が全てコミットされていることを確認
- [x] mainブランチが最新の状態であることを確認

## 作業手順

### 1. feature/landing-page のマージ
- [x] mainブランチに切り替え
- [x] feature/landing-pageブランチをマージ
- [x] コンフリクトがあれば解決
- [x] マージコミットを確認

### 2. feature/chat-function のマージ
- [x] feature/chat-functionブランチをマージ
- [x] コンフリクトがあれば解決
- [x] マージコミットを確認

### 3. feature/add-languages のマージ
- [x] feature/add-languagesブランチをマージ
- [x] コンフリクトがあれば解決
- [x] マージコミットを確認

### 4. 後処理
- [x] 不要になったworktreeを削除
- [ ] リモートブランチの削除（必要に応じて）
- [x] 最終確認

## 注意事項
- マージ前に各ブランチの最新コミットを確認
- コンフリクトが発生した場合は慎重に解決
- マージ完了後はビルドとテストを実行して動作確認