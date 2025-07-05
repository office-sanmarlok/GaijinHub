# GaijinHub プロジェクトCSS調査ワークフロー

## 調査項目

### 1. CSSフレームワークの確認
- [x] package.jsonでCSS関連の依存関係を確認
- [x] tailwind.config.jsの存在確認
- [x] グローバルCSSファイルの確認

### 2. レイアウトコンポーネントの調査
- [x] app/layout.tsxの確認
- [x] componentsディレクトリ内のレイアウト関連コンポーネントの確認
- [x] Header/Footer/Navigation等の共通コンポーネントの確認

### 3. レスポンシブ対応状況
- [x] 既存コンポーネントのレスポンシブ対応確認
- [x] メディアクエリやTailwindのレスポンシブクラスの使用状況

### 4. グローバルスタイル
- [x] globals.cssまたは類似ファイルの確認
- [x] CSS変数やテーマ設定の確認

### 5. ブレークポイント設定
- [x] Tailwindのブレークポイント設定確認
- [x] カスタムブレークポイントの有無

## 調査結果

### 1. CSSフレームワーク
**Tailwind CSS v4** を使用
- `@tailwindcss/postcss`: v4
- `tailwindcss`: v4
- `tailwindcss-animate`: v1.0.7（アニメーション用プラグイン）
- その他のスタイリング関連：
  - `class-variance-authority`: v0.7.1（条件付きクラス名管理）
  - `clsx`: latest（クラス名結合ユーティリティ）
  - `tailwind-merge`: latest（Tailwindクラス名の競合解決）

### 2. レイアウトコンポーネント構造
- **メインレイアウト**: `/app/[locale]/layout.tsx`
  - Header、Footer、SupabaseProvider、ThemeProviderを含む
  - 最小高さ100vh、フレックスボックスレイアウト
  - ヘッダーは固定位置（pt-16でコンテンツのパディング調整）
  
- **Header**: `/app/components/layout/Header.tsx`
  - 固定ヘッダー（position: fixed）
  - レスポンシブ対応なし（モバイルでのハンバーガーメニューなし）
  - 高さ: 16（4rem）

- **Footer**: `/app/components/common/Footer.tsx`
  - グリッドレイアウト使用（md:grid-cols-2）
  - レスポンシブ対応あり

### 3. レスポンシブ対応の現状
- **Tailwindのレスポンシブプレフィックス使用箇所**:
  - `sm:` - 小画面以上
  - `md:` - 中画面以上（主に使用）
  - `lg:` - 大画面以上
  - `xl:` - 特大画面以上
  - `2xl:` - 超特大画面以上

- **主なレスポンシブ対応**:
  - グリッドレイアウト（md:grid-cols-2、lg:grid-cols-3など）
  - フレックスボックスの方向変更（md:flex-row）
  - 表示/非表示の切り替え（hidden md:block）

### 4. グローバルスタイル
- **ファイル**: `/app/globals.css`
- **CSS変数定義**:
  - カラーパレット（--primary、--secondary、--accent等）
  - ボーダー半径（--radius）
  - チャートカラー（--chart-1～5）
  - サイドバー関連のカラー
  - ダークモード対応（.darkクラスで変数値切り替え）

- **Tailwind v4の新機能使用**:
  - `@theme inline`ディレクティブ
  - `@custom-variant dark`
  - CSS変数をTailwindテーマとして定義

### 5. ブレークポイント設定
- **デフォルトのTailwindブレークポイント使用**（カスタマイズなし）
- **コンテナ設定**:
  ```javascript
  container: {
    center: true,
    padding: '2rem',
    screens: {
      '2xl': '1400px', // 2xlサイズでの最大幅制限
    },
  }
  ```

### 特記事項
- **問題点**:
  1. Headerコンポーネントにモバイル対応なし（ハンバーガーメニューなし）
  2. 多くのコンポーネントでレスポンシブ対応が部分的
  3. Tailwind v4の新機能（`@theme inline`）を使用しているが、完全移行はまだ

- **良い点**:
  1. CSS変数によるテーマ管理
  2. ダークモード対応
  3. tailwind-mergeとclsxによる効率的なクラス名管理
  4. アニメーションプラグイン導入済み