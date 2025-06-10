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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ListingDetailProps {
  params: {
    id: string;
  };
}

interface ListingDetail {
  id: string;
  title: string;
  body: string;
  category: string;
  price: number | null;
  created_at: string | null;
  user_id: string;
  
  // Location info
  has_location: boolean | null;
  is_city_only: boolean | null;
  station_id?: string | null;
  muni_id?: string | null;
  lat?: number | null;
  lng?: number | null;
  
  // Images
  rep_image_url?: string | null;
  images?: {
    id: string;
    path: string;
    order: number;
    url?: string;
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
    display_name?: string;
    avatar_url?: string;
  };
  
  // Favorites
  favorite_count?: number;
}

async function getListingDetail(id: string): Promise<ListingDetail | null> {
  const supabase = await createClient();
  
  const { data: listingData, error } = await supabase
    .rpc('get_listing_details', { p_listing_id: id })
    .single();
  
  if (error || !listingData) {
    console.error('Error fetching listing details via RPC:', error);
    return null;
  }
  
  // The RPC returns a single object that mostly matches our ListingDetail.
  // We just need to process the images to add the public URL.
  const listing: ListingDetail = {
    ...listingData,
    images: listingData.images?.map((image: any) => {
      const { data: { publicUrl } } = supabase.storage
        .from('listing-images')
        .getPublicUrl(image.path);
      return { ...image, url: publicUrl };
    }) ?? [],
  };
  
  return listing;
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
  const resolvedParams = await params;
  const listing = await getListingDetail(resolvedParams.id);
  
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
                    <img
                      src="/images/no-image-placeholder.svg"
                      alt="画像なし"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                
                {/* Additional Images */}
                {listing.images && listing.images.length > 0 && (
                  <div className="p-4">
                    <div className="grid grid-cols-4 gap-2">
                      {listing.images.slice(0, 4).map((image) => (
                        <div key={image.id} className="aspect-square bg-gray-200 rounded overflow-hidden">
                          {image.url ? (
                            <img
                              src={image.url}
                              alt={`${listing.title} - ${image.order}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                              <span className="text-xs text-gray-500">No Image</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Listing Details */}
            <Card>
              <CardContent className="space-y-6 pt-6">
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarImage
                      src={listing.user?.avatar_url ?? undefined}
                      alt={listing.user?.display_name ?? 'User avatar'}
                    />
                    <AvatarFallback>
                      <User className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">
                      {listing.user?.display_name || 'Anonymous'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(listing.category)}
                    <span>{getCategoryLabel(listing.category)}</span>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{listing.created_at ? formatDate(listing.created_at) : 'N/A'}</span>
                  </div>
                </div>
                <h1 className="text-3xl font-bold">{listing.title}</h1>
                <p className="text-3xl font-bold text-green-600">{formatPrice(listing.price)}</p>
                <div className="prose max-w-none">
                  <p>{listing.body}</p>
                </div>
              </CardContent>
            </Card>
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
                {/* 駅情報 */}
                {listing.has_location && !listing.is_city_only && listing.station && (
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
                
                {/* 駅名・路線非公開の表示 */}
                {listing.has_location && listing.is_city_only && (
                  <div className="flex items-center gap-2 text-sm">
                    <Train className="w-4 h-4 text-gray-400" />
                    <div className="text-gray-500">
                      駅名・路線は非公開です
                    </div>
                  </div>
                )}
                
                {/* 市区町村・都道府県情報 */}
                {listing.has_location && listing.municipality && (
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
                
                {/* 位置情報なしの場合 */}
                {!listing.has_location && (
                  <div className="text-gray-500 text-sm">
                    位置情報は非公開です
                  </div>
                )}
                
                {/* 位置情報設定不備の場合 */}
                {listing.has_location && !listing.municipality && !listing.station && (
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