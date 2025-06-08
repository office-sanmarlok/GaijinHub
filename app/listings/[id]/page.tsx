import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
// import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Calendar, 
  Heart, 
  Share2, 
  Train,
  Building2,
  User,
  Clock
} from 'lucide-react';

interface ListingDetailProps {
  params: {
    id: string;
  };
}

interface ListingDetail {
  id: string;
  title: string;
  body: string;
  body_en?: string;
  body_zh?: string;
  category: string;
  price: number | null;
  created_at: string;
  user_id: string;
  
  // Location info
  has_location: boolean;
  is_city_only: boolean;
  station_id?: string;
  muni_id?: string;
  lat?: number;
  lng?: number;
  
  // Images
  rep_image_url?: string;
  images?: {
    id: string;
    path: string;
    order: number;
  }[];
  
  // Related data
  station?: {
    station_cd: string;
    station_name: string;
    line_name?: string;
    company_name?: string;
  };
  municipality?: {
    muni_id: string;
    muni_name: string;
    pref_name?: string;
  };
  
  // User info
  user?: {
    id: string;
    email?: string;
  };
  
  // Favorites
  is_favorited?: boolean;
  favorite_count?: number;
}

async function getListingDetail(id: string): Promise<ListingDetail | null> {
  const supabase = await createClient();
  
  // Main listing data
  const { data: listing, error } = await supabase
    .from('listings')
    .select(`
      id, title, body, body_en, body_zh, category, price, created_at, user_id,
      has_location, is_city_only, station_id, muni_id, lat, lng, rep_image_url
    `)
    .eq('id', id)
    .single();
  
  if (error || !listing) {
    return null;
  }
  
  // Get images
  const { data: images } = await supabase
    .from('images')
    .select('id, path, order')
    .eq('listing_id', id)
    .order('order');
  
  // Get station info if available
  let station = null;
  if (listing.station_id) {
    const { data: stationData } = await supabase
      .from('stations')
      .select(`
        station_cd, station_name,
        lines:line_cd (
          line_name,
          companies:company_cd (
            company_name
          )
        )
      `)
      .eq('station_cd', listing.station_id)
      .single();
    
    if (stationData) {
      station = {
        station_cd: stationData.station_cd,
        station_name: stationData.station_name,
        line_name: (stationData.lines as any)?.line_name,
        company_name: (stationData.lines as any)?.companies?.company_name
      };
    }
  }
  
  // Get municipality info if available
  let municipality = null;
  if (listing.muni_id) {
    const { data: muniData } = await supabase
      .from('municipalities')
      .select(`
        muni_id, muni_name,
        prefectures:pref_id (
          pref_name
        )
      `)
      .eq('muni_id', listing.muni_id)
      .single();
    
    if (muniData) {
      municipality = {
        muni_id: muniData.muni_id,
        muni_name: muniData.muni_name,
        pref_name: (muniData.prefectures as any)?.pref_name
      };
    }
  }
  
  // Get favorite count
  const { count: favoriteCount } = await supabase
    .from('favorites')
    .select('*', { count: 'exact', head: true })
    .eq('listing_id', id);
  
  return {
    ...listing,
    images: images || [],
    station: station || undefined,
    municipality: municipality || undefined,
    favorite_count: favoriteCount || 0
  };
}

function getCategoryIcon(category: string) {
  switch (category) {
    case 'Housing':
      return <Building2 className="w-4 h-4" />;
    case 'Jobs':
      return <User className="w-4 h-4" />;
    case 'Items for Sale':
      return <Building2 className="w-4 h-4" />;
    case 'Services':
      return <Clock className="w-4 h-4" />;
    default:
      return null;
  }
}

function getCategoryLabel(category: string) {
  switch (category) {
    case 'Housing':
      return '住居';
    case 'Jobs':
      return '求人';
    case 'Items for Sale':
      return '売ります';
    case 'Services':
      return 'サービス';
    default:
      return category;
  }
}

function formatPrice(price: number | null): string {
  if (!price) return '価格応談';
  return `¥${price.toLocaleString()}`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export default async function ListingDetailPage({ params }: ListingDetailProps) {
  const listing = await getListingDetail(params.id);
  
  if (!listing) {
    notFound();
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <Card>
              <CardContent className="p-0">
                <div className="aspect-video bg-gray-200 rounded-t-lg overflow-hidden">
                  {listing.rep_image_url ? (
                    <img
                      src={listing.rep_image_url}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Building2 className="w-16 h-16" />
                    </div>
                  )}
                </div>
                
                {/* Additional Images */}
                {listing.images && listing.images.length > 0 && (
                  <div className="p-4">
                    <div className="grid grid-cols-4 gap-2">
                      {listing.images.slice(0, 4).map((image) => (
                        <div key={image.id} className="aspect-square bg-gray-200 rounded overflow-hidden">
                          <img
                            src={image.path}
                            alt={`${listing.title} - ${image.order}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Title and Basic Info */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                        {getCategoryIcon(listing.category)}
                        {getCategoryLabel(listing.category)}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-1 border border-gray-300 text-gray-600 text-xs rounded">
                        <Calendar className="w-3 h-3" />
                        {formatDate(listing.created_at)}
                      </span>
                    </div>
                    <CardTitle className="text-2xl mb-2">{listing.title}</CardTitle>
                    <div className="text-2xl font-bold text-green-600">
                      {formatPrice(listing.price)}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Heart className="w-4 h-4 mr-1" />
                      {listing.favorite_count}
                    </Button>
                    <Button variant="outline" size="sm">
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="prose max-w-none">
                  <p className="whitespace-pre-wrap text-gray-700">
                    {listing.body}
                  </p>
                </div>
              </CardContent>
            </Card>
            
            {/* English/Chinese Content */}
            {(listing.body_en || listing.body_zh) && (
              <Card>
                <CardHeader>
                  <CardTitle>多言語情報</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {listing.body_en && (
                    <div>
                      <h4 className="font-semibold mb-2">English</h4>
                      <p className="text-gray-700 whitespace-pre-wrap">{listing.body_en}</p>
                    </div>
                  )}
                  {listing.body_zh && (
                    <div>
                      <h4 className="font-semibold mb-2">中文</h4>
                      <p className="text-gray-700 whitespace-pre-wrap">{listing.body_zh}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Location Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  所在地
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {listing.station && (
                  <div className="flex items-center gap-2 text-sm">
                    <Train className="w-4 h-4 text-blue-600" />
                    <div>
                      <div className="font-medium">{listing.station.station_name}駅</div>
                      {listing.station.line_name && (
                        <div className="text-gray-500">
                          {listing.station.company_name} {listing.station.line_name}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {listing.municipality && (
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="w-4 h-4 text-green-600" />
                    <div>
                      <div className="font-medium">{listing.municipality.muni_name}</div>
                      {listing.municipality.pref_name && (
                        <div className="text-gray-500">{listing.municipality.pref_name}</div>
                      )}
                    </div>
                  </div>
                )}
                
                {!listing.station && !listing.municipality && (
                  <div className="text-gray-500 text-sm">
                    位置情報が設定されていません
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle>お問い合わせ</CardTitle>
              </CardHeader>
              <CardContent>
                <Button className="w-full" size="lg">
                  投稿者に連絡する
                </Button>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  ※ ログインが必要です
                </p>
              </CardContent>
            </Card>
            
            {/* Safety Tips */}
            <Card>
              <CardHeader>
                <CardTitle>安全な取引のために</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 事前に実物を確認しましょう</li>
                  <li>• 公共の場所で待ち合わせしましょう</li>
                  <li>• 前払いは避けましょう</li>
                  <li>• 怪しい取引は報告しましょう</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 