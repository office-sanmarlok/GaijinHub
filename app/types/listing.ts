export interface ListingCard {
  id: string;
  title: string;
  body: string;
  category: string;
  price: number | null;
  currency: string;
  original_language?: string;

  location: {
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
  };

  images: {
    url: string;
    alt: string;
    is_primary: boolean;
  }[];
  rep_image_url?: string;

  created_at: string;
  user_id: string;
  is_favorited?: boolean;
}

export interface ListingCardData {
  id: string;
  title: string;
  body: string;
  category: string;
  price: number | null;
  currency: string;
  original_language?: string;
  rep_image_url?: string;
  images: {
    url: string;
    alt: string;
    is_primary: boolean;
  }[];
  location: {
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
    distance_meters?: number;
  };
  created_at: string;
  user_id: string;
}
