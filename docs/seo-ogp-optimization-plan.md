# GaijinHub SEO及びOGP最適化計画

## 概要
GaijinHubの検索エンジン最適化（SEO）とOpen Graph Protocol（OGP）の実装計画書

## 実装チェックリスト

### 1. 基本的なSEO対策

#### メタタグの最適化
- [ ] 各ページに適切なtitleタグを設定
  - [ ] トップページ: "GaijinHub - 日本での外国人向け不動産情報"
  - [ ] 物件一覧: "賃貸物件一覧 | GaijinHub"
  - [ ] 物件詳細: "{物件名} - {エリア} | GaijinHub"
- [ ] meta descriptionの設定
  - [ ] トップページ用の説明文（150-160文字）
  - [ ] 物件一覧用の動的な説明文
  - [ ] 物件詳細用の動的な説明文
- [ ] canonicalタグの実装
- [ ] robots.txtの最適化
- [ ] sitemap.xmlの動的生成改善

#### 構造化データの実装
- [ ] JSON-LD形式での実装
  - [ ] Organization（組織情報）
  - [ ] BreadcrumbList（パンくずリスト）
  - [ ] Product（物件情報）
  - [ ] LocalBusiness（不動産業情報）
- [ ] 物件詳細ページにRealEstateListingスキーマを追加

#### パフォーマンス最適化
- [ ] 画像の最適化
  - [ ] next/imageコンポーネントの活用
  - [ ] WebP形式への自動変換
  - [ ] 適切なsrcsetの設定
  - [ ] Lazy Loadingの実装
- [ ] Core Web Vitalsの改善
  - [ ] LCP（Largest Contentful Paint）の最適化
  - [ ] FID（First Input Delay）の改善
  - [ ] CLS（Cumulative Layout Shift）の削減

### 2. OGP（Open Graph Protocol）対策

#### 基本的なOGPタグ
- [ ] og:titleの実装
- [ ] og:descriptionの実装
- [ ] og:imageの実装
  - [ ] デフォルトOG画像の作成（1200x630px）
  - [ ] 物件詳細用の動的OG画像生成
- [ ] og:urlの実装
- [ ] og:typeの適切な設定
- [ ] og:site_nameの設定

#### Twitter Card対応
- [ ] twitter:cardの設定（summary_large_image）
- [ ] twitter:siteの設定
- [ ] twitter:creatorの設定
- [ ] twitter:titleの実装
- [ ] twitter:descriptionの実装
- [ ] twitter:imageの実装

#### 言語別OGP対応
- [ ] og:localeの実装
- [ ] og:locale:alternateの実装（日本語/英語切替）

### 3. 国際化（i18n）SEO対策

#### 言語対応
- [ ] hreflangタグの実装
  - [ ] 日本語版へのリンク
  - [ ] 英語版へのリンク
  - [ ] x-defaultの設定
- [ ] HTMLのlang属性の動的設定
- [ ] 言語別URLの構造化（/ja/, /en/）

#### 地域最適化
- [ ] 日本の検索エンジン向け最適化
- [ ] Google My Businessとの連携検討
- [ ] ローカルSEOの実装

### 4. コンテンツSEO

#### キーワード戦略
- [ ] ターゲットキーワードの選定
  - [ ] "外国人 賃貸"
  - [ ] "gaijin friendly apartment"
  - [ ] "Tokyo rental for foreigners"
  - [ ] エリア別キーワード
- [ ] コンテンツへの自然なキーワード配置
- [ ] 内部リンク構造の最適化

#### コンテンツ作成
- [ ] エリアガイドページの作成
- [ ] 外国人向け賃貸ガイドの作成
- [ ] よくある質問（FAQ）ページの作成
- [ ] ブログセクションの追加検討

### 5. 技術的実装

#### Next.js App Routerでの実装
- [ ] metadata APIの活用
  - [ ] generateMetadata関数の実装
  - [ ] 動的メタデータの生成
- [ ] viewport設定の最適化
- [ ] manifest.jsonの改善

#### 監視とトラッキング
- [ ] Google Search Consoleの設定
- [ ] Google Analytics 4の実装
- [ ] サイト内検索のトラッキング
- [ ] コンバージョントラッキングの設定

### 6. モバイル最適化

#### レスポンシブデザイン
- [ ] モバイルファーストインデックスへの対応
- [ ] タッチターゲットサイズの最適化
- [ ] モバイル用フォントサイズの調整

#### PWA対応
- [ ] Service Workerの実装
- [ ] オフライン対応
- [ ] プッシュ通知の実装検討

## 実装優先順位

1. **高優先度（1週間以内）**
   - 基本的なメタタグの実装
   - OGPタグの実装
   - sitemap.xmlの改善

2. **中優先度（2-3週間）**
   - 構造化データの実装
   - 画像最適化
   - Core Web Vitalsの改善

3. **低優先度（1ヶ月以内）**
   - コンテンツSEOの実装
   - PWA対応
   - 高度な分析ツールの導入

## 成功指標（KPI）

- [ ] Google PageSpeed Insightsスコア90以上
- [ ] Core Web Vitalsの全指標が「良好」
- [ ] 検索順位の向上（主要キーワードでトップ10入り）
- [ ] オーガニックトラフィックの増加（3ヶ月で50%増）
- [ ] 直帰率の改善（現状から20%削減）
- [ ] 平均セッション時間の向上（2分以上）

## 参考リソース

- [Next.js SEOガイド](https://nextjs.org/learn/seo/introduction-to-seo)
- [Google Search Central](https://developers.google.com/search)
- [Open Graph Protocol](https://ogp.me/)
- [Schema.org](https://schema.org/)
- [Core Web Vitals](https://web.dev/vitals/)