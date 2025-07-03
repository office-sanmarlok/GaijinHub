# Git Worktree 導入手順書

## 前提条件
- Git バージョン 2.5 以上（現在: 2.25.1 ✓）

## 手順

### 1. 基本的な使い方

- [ ] 新しいworktreeを作成
  ```bash
  git worktree add <path> <branch>
  ```

- [ ] 既存のブランチでworktreeを作成
  ```bash
  git worktree add ../project-feature feature-branch
  ```

- [ ] 新しいブランチを作成してworktreeを追加
  ```bash
  git worktree add -b new-feature ../project-new-feature
  ```

### 2. 管理コマンド

- [ ] worktreeの一覧を確認
  ```bash
  git worktree list
  ```

- [ ] 不要なworktreeを削除
  ```bash
  git worktree remove <path>
  ```

- [ ] 削除されたworktreeをクリーンアップ
  ```bash
  git worktree prune
  ```

### 3. 実践例（このプロジェクトでの使用）

- [x] 新規言語追加用worktreeを作成
  ```bash
  git worktree add -b feature/add-languages ../GaijinHub-languages
  ```

- [x] チャット機能実装用worktreeを作成
  ```bash
  git worktree add -b feature/chat-function ../GaijinHub-chat
  ```

### 4. 注意事項

- 同じブランチを複数のworktreeで同時にチェックアウトできない
- worktreeを削除する際は、未コミットの変更に注意
- メインリポジトリを削除すると、すべてのworktreeが使用できなくなる

### 5. 便利な使い方

- [ ] 一時的な実験用worktree
  ```bash
  git worktree add -d ../experiment HEAD
  ```

- [ ] リモートブランチからworktreeを作成
  ```bash
  git worktree add ../hotfix origin/hotfix-branch
  ```