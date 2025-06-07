'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { ChevronDown, ChevronUp, MapPin, Building, Train } from 'lucide-react';
import { LayoutGrid, List } from "lucide-react";

interface Listing {
  id: string;
  title: string;
  description?: string;
  price?: number | null;
  category: string;
  location?: string;
  imageUrl?: string;
  municipality?: {
    name: string;
  } | null;
  station?: {
    name_kanji: string;
    lines?: {
      line_ja: string;
    }[] | null;
  } | null;
}

interface GroupedListingGridProps {
  listings: Listing[];
  viewMode: 'grid' | 'list';
  groupBy: 'prefecture' | 'municipality' | 'line' | 'none';
}

interface ListingGroup {
  groupName: string;
  groupType: 'prefecture' | 'municipality' | 'line';
  listings: Listing[];
  count: number;
}

export default function GroupedListingGrid({ 
  listings, 
  viewMode, 
  groupBy 
}: GroupedListingGridProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // グルーピング無しの場合は通常表示
  if (groupBy === 'none') {
    return <ListingGrid listings={listings} viewMode={viewMode} />;
  }

  // リスティングをグループ化
  const groupedListings = groupListings(listings, groupBy);

  const toggleGroup = (groupName: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupName)) {
      newExpanded.delete(groupName);
    } else {
      newExpanded.add(groupName);
    }
    setExpandedGroups(newExpanded);
  };

  const expandAllGroups = () => {
    setExpandedGroups(new Set(groupedListings.map(group => group.groupName)));
  };

  const collapseAllGroups = () => {
    setExpandedGroups(new Set());
  };

  const getGroupIcon = (groupType: string) => {
    switch (groupType) {
      case 'prefecture':
        return <MapPin className="h-4 w-4" />;
      case 'municipality':
        return <Building className="h-4 w-4" />;
      case 'line':
        return <Train className="h-4 w-4" />;
      default:
        return <MapPin className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* グループ操作ボタン */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          {groupedListings.length}グループ、計{listings.length}件の結果
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={expandAllGroups}>
            すべて展開
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAllGroups}>
            すべて折りたたみ
          </Button>
        </div>
      </div>

      {/* グループ化されたリスティング表示 */}
      {groupedListings.map((group) => {
        const isExpanded = expandedGroups.has(group.groupName);
        
        return (
          <Card key={group.groupName} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => toggleGroup(group.groupName)}
              >
                <div className="flex items-center gap-3">
                  {getGroupIcon(group.groupType)}
                  <div>
                    <CardTitle className="text-lg">{group.groupName}</CardTitle>
                    <Badge variant="secondary" className="mt-1">
                      {group.count}件
                    </Badge>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardHeader>
            
            {isExpanded && (
              <CardContent className="pt-0">
                <ListingGrid listings={group.listings} viewMode={viewMode} />
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}

// グルーピング関数
function groupListings(listings: Listing[], groupBy: 'prefecture' | 'municipality' | 'line'): ListingGroup[] {
  const groups = new Map<string, Listing[]>();

  listings.forEach(listing => {
    let groupKey = '';

    switch (groupBy) {
      case 'prefecture':
        // 都道府県でグルーピング（市区町村名から推定）
        groupKey = extractPrefectureFromMunicipality(listing.municipality?.name || listing.location || '不明');
        break;
      case 'municipality':
        groupKey = listing.municipality?.name || listing.location || '不明';
        break;
      case 'line':
        groupKey = listing.station?.lines?.[0]?.line_ja || '路線不明';
        break;
    }

    if (!groups.has(groupKey)) {
      groups.set(groupKey, []);
    }
    groups.get(groupKey)!.push(listing);
  });

  // グループを配列に変換してソート
  return Array.from(groups.entries())
    .map(([groupName, groupListings]) => ({
      groupName,
      groupType: groupBy,
      listings: groupListings,
      count: groupListings.length,
    }))
    .sort((a, b) => b.count - a.count); // 件数の多い順にソート
}

// 市区町村名から都道府県を推定
function extractPrefectureFromMunicipality(municipalityName: string): string {
  const prefectures = [
    '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
    '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
    '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
    '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
    '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
    '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
    '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
  ];

  for (const prefecture of prefectures) {
    if (municipalityName.includes(prefecture.replace(/[都道府県]$/, ''))) {
      return prefecture;
    }
  }

  return '不明';
}

// 基本的なリスティンググリッドコンポーネント
function ListingGrid({ listings, viewMode }: { listings: Listing[], viewMode: 'grid' | 'list' }) {
  if (viewMode === 'list') {
    return (
      <div className="space-y-4">
        {listings.map((listing) => (
          <Card key={listing.id} className="overflow-hidden">
            <div className="flex">
              <div className="w-48 h-32 bg-gray-200 flex-shrink-0">
                <img
                  src={listing.imageUrl}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <CardContent className="flex-1 p-4">
                <h3 className="font-semibold text-lg mb-2">{listing.title}</h3>
                <p className="text-muted-foreground text-sm mb-2">{listing.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{listing.location}</span>
                  {listing.price && (
                    <span className="font-bold text-lg">¥{listing.price.toLocaleString()}</span>
                  )}
                </div>
              </CardContent>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {listings.map((listing) => (
        <Card key={listing.id} className="overflow-hidden">
          <div className="aspect-video bg-gray-200">
            <img
              src={listing.imageUrl}
              alt={listing.title}
              className="w-full h-full object-cover"
            />
          </div>
          <CardContent className="p-4">
            <h3 className="font-semibold text-lg mb-2">{listing.title}</h3>
            <p className="text-muted-foreground text-sm mb-2">{listing.description}</p>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{listing.location}</span>
              {listing.price && (
                <span className="font-bold text-lg">¥{listing.price.toLocaleString()}</span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 