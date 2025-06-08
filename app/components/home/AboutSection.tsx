import { Card, CardContent } from '@/components/ui/card';

export default function AboutSection() {
  return (
    <section className="py-16 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Why GaijinHub?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            日本で暮らす外国人のための、包括的なコミュニティプラットフォーム
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* 包括的コミュニティ */}
          <Card className="text-center p-6">
            <CardContent className="pt-6">
              <div className="text-4xl mb-4">🤝</div>
              <h3 className="text-xl font-semibold mb-3">
                包括的コミュニティ
              </h3>
              <p className="text-gray-600 mb-2">
                国籍を問わず、日本で暮らすすべての外国人が参加できる統一コミュニティ
              </p>
              <p className="text-sm text-gray-500">
                Inclusive Community for All Foreign Residents
              </p>
            </CardContent>
          </Card>

          {/* 全国対応 */}
          <Card className="text-center p-6">
            <CardContent className="pt-6">
              <div className="text-4xl mb-4">🌏</div>
              <h3 className="text-xl font-semibold mb-3">
                全国対応
              </h3>
              <p className="text-gray-600 mb-2">
                北海道から沖縄まで、日本全国どこでも利用可能
              </p>
              <p className="text-sm text-gray-500">
                Nationwide Coverage from Hokkaido to Okinawa
              </p>
            </CardContent>
          </Card>

          {/* 多様なサービス */}
          <Card className="text-center p-6">
            <CardContent className="pt-6">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold mb-3">
                多様なサービス
              </h3>
              <p className="text-gray-600 mb-2">
                住居、仕事、売買、サービスまで、生活に必要なすべてを一箇所で
              </p>
              <p className="text-sm text-gray-500">
                Housing, Jobs, Items, Services - All in One Place
              </p>
            </CardContent>
          </Card>

          {/* 外国人フレンドリー */}
          <Card className="text-center p-6">
            <CardContent className="pt-6">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-xl font-semibold mb-3">
                外国人フレンドリー
              </h3>
              <p className="text-gray-600 mb-2">
                外国人の視点で設計された、使いやすいインターフェース
              </p>
              <p className="text-sm text-gray-500">
                Designed from Foreign Residents&apos; Perspective
              </p>
            </CardContent>
          </Card>

          {/* 安心・安全 */}
          <Card className="text-center p-6">
            <CardContent className="pt-6">
              <div className="text-4xl mb-4">🛡️</div>
              <h3 className="text-xl font-semibold mb-3">
                安心・安全
              </h3>
              <p className="text-gray-600 mb-2">
                ユーザー認証とモデレーションで、安全な取引環境を提供
              </p>
              <p className="text-sm text-gray-500">
                Safe and Secure Trading Environment
              </p>
            </CardContent>
          </Card>

          {/* コミュニティサポート */}
          <Card className="text-center p-6">
            <CardContent className="pt-6">
              <div className="text-4xl mb-4">❤️</div>
              <h3 className="text-xl font-semibold mb-3">
                コミュニティサポート
              </h3>
              <p className="text-gray-600 mb-2">
                困ったときはコミュニティメンバーがお互いにサポート
              </p>
              <p className="text-sm text-gray-500">
                Community Members Support Each Other
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 統計情報 */}
        <div className="mt-16 text-center">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">47</div>
              <p className="text-gray-600">都道府県対応</p>
              <p className="text-sm text-gray-500">Prefectures</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">4</div>
              <p className="text-gray-600">主要カテゴリ</p>
              <p className="text-sm text-gray-500">Main Categories</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">24/7</div>
              <p className="text-gray-600">いつでも利用可能</p>
              <p className="text-sm text-gray-500">Always Available</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">FREE</div>
              <p className="text-gray-600">基本利用無料</p>
              <p className="text-sm text-gray-500">Free to Use</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 