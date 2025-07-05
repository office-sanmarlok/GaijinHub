export interface Translation {
  title: string;
  body: string;
  is_auto_translated: boolean;
}

export interface Location {
  has_location: boolean;
  is_city_only: boolean;
  station_name?: string;
  station_name_r?: string;
  station_group_name?: string;
  station_group_name_r?: string;
  muni_name: string;
  muni_name_r?: string;
  pref_name: string;
  pref_name_r?: string;
  line_name?: string;
  line_name_r?: string;
  company_name?: string;
  company_name_r?: string;
  distance_meters?: number;
  distance_text?: string;
}

export interface ListingImage {
  url: string;
  alt: string;
  is_primary: boolean;
}

export interface Listing {
  id: string;
  title: string;
  body: string;
  category: string;
  price: number | null;
  currency: string;
  original_language?: string;
  rep_image_url?: string;
  translation?: Translation;
  images: ListingImage[];
  location: Location;
  created_at: string;
  user_id: string;
  is_favorited?: boolean;
}

export interface ListingCardProps {
  listing: Listing;
  viewMode?: 'grid' | 'list';
}