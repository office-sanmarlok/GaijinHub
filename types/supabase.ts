export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      listings: {
        Row: {
          id: string;
          title: string;
          body: string;
          price: number;
          category: string;
          created_at: string;
          updated_at: string;
          user_id: string;
          has_location: boolean;
          is_city_only: boolean;
          station_id: string | null;
          municipality_id: string | null;
          image_url?: string;
        };
        Insert: {
          id?: string;
          title: string;
          body: string;
          price: number;
          category: string;
          created_at?: string;
          updated_at?: string;
          user_id: string;
          has_location: boolean;
          is_city_only: boolean;
          station_id?: string | null;
          municipality_id?: string | null;
          image_url?: string;
        };
        Update: {
          id?: string;
          title?: string;
          body?: string;
          price?: number;
          category?: string;
          created_at?: string;
          updated_at?: string;
          user_id?: string;
          has_location?: boolean;
          is_city_only?: boolean;
          station_id?: string | null;
          municipality_id?: string | null;
          image_url?: string;
        };
      };
      tokyo_station_groups: {
        Row: {
          id: string;
          name_kanji: string;
          name_kana: string;
          name_romaji: string;
          municipality_id: string;
          lat: number;
          lon: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name_kanji: string;
          name_kana: string;
          name_romaji: string;
          municipality_id: string;
          lat?: number;
          lon?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name_kanji?: string;
          name_kana?: string;
          name_romaji?: string;
          municipality_id?: string;
          lat?: number;
          lon?: number;
          created_at?: string;
        };
      };
      tokyo_station_line_relations: {
        Row: {
          station_group_id: string;
          line_code: string;
          id: string;
          created_at: string;
        };
        Insert: {
          station_group_id: string;
          line_code: string;
          id?: string;
          created_at?: string;
        };
        Update: {
          station_group_id?: string;
          line_code?: string;
          id?: string;
          created_at?: string;
        };
      };
      tokyo_lines: {
        Row: {
          line_code: string;
          line_ja: string;
          operator_ja: string;
          operator_en: string;
          line_en: string;
          created_at: string;
        };
        Insert: {
          line_code: string;
          line_ja: string;
          operator_ja: string;
          operator_en: string;
          line_en: string;
          created_at?: string;
        };
        Update: {
          line_code?: string;
          line_ja?: string;
          operator_ja?: string;
          operator_en?: string;
          line_en?: string;
          created_at?: string;
        };
      };
      tokyo_municipalities: {
        Row: {
          id: string;
          name: string;
          hurigana: string;
          prefecture: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          hurigana: string;
          prefecture: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          hurigana?: string;
          prefecture?: string;
          created_at?: string;
        };
      };
      favorites: {
        Row: {
          id: string
          user_id: string
          listing_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          listing_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          listing_id?: string
          created_at?: string
        }
      }
      images: {
        Row: {
          id: string
          listing_id: string
          path: string
          order: number
          created_at: string
        }
        Insert: {
          id?: string
          listing_id: string
          path: string
          order: number
          created_at?: string
        }
        Update: {
          id?: string
          listing_id?: string
          path?: string
          order?: number
          created_at?: string
        }
      }
      avatars: {
        Row: {
          id: string
          user_id: string
          avatar_path: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          avatar_path: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          avatar_path?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [key: string]: unknown;
    }
    Enums: {
      [key: string]: unknown;
    }
  }
}

type StationRow = Database['public']['Tables']['tokyo_station_groups']['Row'];
type LineRow = Database['public']['Tables']['tokyo_lines']['Row'];

export interface StationLineJoin {
  line: LineRow;
}

export interface JoinedStation extends StationRow {
  lines: StationLineJoin[];
} 