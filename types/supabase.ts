export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      avatars: {
        Row: {
          avatar_path: string | null
          user_id: string
        }
        Insert: {
          avatar_path?: string | null
          user_id: string
        }
        Update: {
          avatar_path?: string | null
          user_id?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings_with_location"
            referencedColumns: ["listing_id"]
          },
        ]
      }
      images: {
        Row: {
          id: string
          listing_id: string
          order: number
          path: string
        }
        Insert: {
          id?: string
          listing_id: string
          order: number
          path: string
        }
        Update: {
          id?: string
          listing_id?: string
          order?: number
          path?: string
        }
        Relationships: [
          {
            foreignKeyName: "images_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "images_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings_with_location"
            referencedColumns: ["listing_id"]
          },
        ]
      }
      listings: {
        Row: {
          body: string
          body_en: string | null
          body_zh: string | null
          category: string
          city: string | null
          created_at: string | null
          has_location: boolean | null
          id: string
          is_city_only: boolean | null
          lat: number | null
          lng: number | null
          municipality_id: string | null
          point: unknown | null
          price: number | null
          rep_image_url: string | null
          station_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          body: string
          body_en?: string | null
          body_zh?: string | null
          category: string
          city?: string | null
          created_at?: string | null
          has_location?: boolean | null
          id?: string
          is_city_only?: boolean | null
          lat?: number | null
          lng?: number | null
          municipality_id?: string | null
          point?: unknown | null
          price?: number | null
          rep_image_url?: string | null
          station_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string
          body_en?: string | null
          body_zh?: string | null
          category?: string
          city?: string | null
          created_at?: string | null
          has_location?: boolean | null
          id?: string
          is_city_only?: boolean | null
          lat?: number | null
          lng?: number | null
          municipality_id?: string | null
          point?: unknown | null
          price?: number | null
          rep_image_url?: string | null
          station_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "listings_municipality_id_fkey"
            columns: ["municipality_id"]
            isOneToOne: false
            referencedRelation: "tokyo_municipalities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "tokyo_station_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      tokyo_lines: {
        Row: {
          created_at: string | null
          line_code: string
          line_en: string
          line_ja: string
          operator_en: string
          operator_ja: string
        }
        Insert: {
          created_at?: string | null
          line_code: string
          line_en: string
          line_ja: string
          operator_en: string
          operator_ja: string
        }
        Update: {
          created_at?: string | null
          line_code?: string
          line_en?: string
          line_ja?: string
          operator_en?: string
          operator_ja?: string
        }
        Relationships: []
      }
      tokyo_municipalities: {
        Row: {
          created_at: string | null
          hurigana: string
          id: string
          name: string
          prefecture: string
        }
        Insert: {
          created_at?: string | null
          hurigana: string
          id: string
          name: string
          prefecture: string
        }
        Update: {
          created_at?: string | null
          hurigana?: string
          id?: string
          name?: string
          prefecture?: string
        }
        Relationships: []
      }
      tokyo_station_groups: {
        Row: {
          created_at: string | null
          id: string
          lat: number | null
          lon: number | null
          municipality_id: string | null
          name_kana: string | null
          name_kanji: string
          name_romaji: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          lat?: number | null
          lon?: number | null
          municipality_id?: string | null
          name_kana?: string | null
          name_kanji: string
          name_romaji?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          lat?: number | null
          lon?: number | null
          municipality_id?: string | null
          name_kana?: string | null
          name_kanji?: string
          name_romaji?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tokyo_station_groups_municipality_id_fkey"
            columns: ["municipality_id"]
            isOneToOne: false
            referencedRelation: "tokyo_municipalities"
            referencedColumns: ["id"]
          },
        ]
      }
      tokyo_station_line_relations: {
        Row: {
          created_at: string | null
          id: string
          line_code: string | null
          station_group_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          line_code?: string | null
          station_group_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          line_code?: string | null
          station_group_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tokyo_station_line_relations_line_code_fkey"
            columns: ["line_code"]
            isOneToOne: false
            referencedRelation: "tokyo_lines"
            referencedColumns: ["line_code"]
          },
          {
            foreignKeyName: "tokyo_station_line_relations_station_group_id_fkey"
            columns: ["station_group_id"]
            isOneToOne: false
            referencedRelation: "tokyo_station_groups"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      listings_with_location: {
        Row: {
          body: string | null
          body_en: string | null
          body_zh: string | null
          category: string | null
          created_at: string | null
          has_location: boolean | null
          lat: number | null
          lines: Json | null
          listing_id: string | null
          lng: number | null
          municipality_hurigana: string | null
          municipality_id: string | null
          municipality_name: string | null
          point: unknown | null
          price: number | null
          show_only_municipality: boolean | null
          station_id: string | null
          station_kana: string | null
          station_name: string | null
          title: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listings_municipality_id_fkey"
            columns: ["municipality_id"]
            isOneToOne: false
            referencedRelation: "tokyo_municipalities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "tokyo_station_groups"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_auth_user: {
        Args: { user_id: string }
        Returns: Json
      }
      get_avatar_url: {
        Args: { user_id: string }
        Returns: string
      }
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      search_lines_by_keyword: {
        Args: { keyword: string }
        Returns: {
          line_code: string
          operator_ja: string
          line_ja: string
        }[]
      }
      search_listings_by_distance: {
        Args: {
          p_lat: number
          p_lng: number
          p_max_distance?: number
          p_limit?: number
          p_offset?: number
          p_category?: string
        }
        Returns: {
          listing_id: string
          title: string
          body: string
          price: number
          category: string
          user_id: string
          created_at: string
          rep_image_url: string
          lat: number
          lng: number
          municipality_name: string
          station_name: string
          distance_meters: number
        }[]
      }
      search_listings_by_location: {
        Args: {
          p_station_id?: string
          p_line_code?: string
          p_municipality_id?: string
          p_keyword?: string
          p_limit?: number
          p_offset?: number
        }
        Returns: {
          listing_id: string
          title: string
          body: string
          price: number
          category: string
          user_id: string
          created_at: string
          municipality_name: string
          station_name: string
          distance: number
        }[]
      }
      search_municipalities_by_keyword: {
        Args: { keyword: string }
        Returns: {
          id: string
          name: string
          hurigana: string
        }[]
      }
      search_stations_by_keyword: {
        Args: { keyword: string }
        Returns: {
          id: string
          name_kanji: string
          name_kana: string
          municipality_name: string
          lines: Json
        }[]
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
