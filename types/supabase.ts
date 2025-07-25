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
      companies: {
        Row: {
          company_cd: string
          company_name: string
          company_name_h: string | null
          company_name_r: string | null
          company_type: string | null
          created_at: string | null
          e_status: string | null
          rr_cd: string | null
        }
        Insert: {
          company_cd: string
          company_name: string
          company_name_h?: string | null
          company_name_r?: string | null
          company_type?: string | null
          created_at?: string | null
          e_status?: string | null
          rr_cd?: string | null
        }
        Update: {
          company_cd?: string
          company_name?: string
          company_name_h?: string | null
          company_name_r?: string | null
          company_type?: string | null
          created_at?: string | null
          e_status?: string | null
          rr_cd?: string | null
        }
        Relationships: []
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          is_active: boolean
          joined_at: string
          last_read_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          is_active?: boolean
          joined_at?: string
          last_read_at?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          is_active?: boolean
          joined_at?: string
          last_read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string | null
          type: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          type?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          type?: string | null
          updated_at?: string
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
        ]
      }
      lines: {
        Row: {
          company_cd: string
          created_at: string | null
          e_status: string | null
          lat: number | null
          line_id: string
          line_name: string
          line_name_h: string | null
          line_name_r: string | null
          lon: number | null
          zoom: number | null
        }
        Insert: {
          company_cd: string
          created_at?: string | null
          e_status?: string | null
          lat?: number | null
          line_id: string
          line_name: string
          line_name_h?: string | null
          line_name_r?: string | null
          lon?: number | null
          zoom?: number | null
        }
        Update: {
          company_cd?: string
          created_at?: string | null
          e_status?: string | null
          lat?: number | null
          line_id?: string
          line_name?: string
          line_name_h?: string | null
          line_name_r?: string | null
          lon?: number | null
          zoom?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lines_company_cd_fkey"
            columns: ["company_cd"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["company_cd"]
          },
        ]
      }
      listing_translations: {
        Row: {
          body: string
          created_at: string | null
          id: string
          is_auto_translated: boolean | null
          listing_id: string
          locale: string
          title: string
          translated_at: string | null
          updated_at: string | null
        }
        Insert: {
          body: string
          created_at?: string | null
          id?: string
          is_auto_translated?: boolean | null
          listing_id: string
          locale: string
          title: string
          translated_at?: string | null
          updated_at?: string | null
        }
        Update: {
          body?: string
          created_at?: string | null
          id?: string
          is_auto_translated?: boolean | null
          listing_id?: string
          locale?: string
          title?: string
          translated_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listing_translations_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          body: string
          category: string
          created_at: string | null
          has_location: boolean | null
          id: string
          is_city_only: boolean | null
          lat: number | null
          lng: number | null
          muni_id: string | null
          original_language: string | null
          point: unknown | null
          pref_id: string | null
          price: number | null
          rep_image_url: string | null
          station_g_cd: string | null
          station_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          body: string
          category: string
          created_at?: string | null
          has_location?: boolean | null
          id?: string
          is_city_only?: boolean | null
          lat?: number | null
          lng?: number | null
          muni_id?: string | null
          original_language?: string | null
          point?: unknown | null
          pref_id?: string | null
          price?: number | null
          rep_image_url?: string | null
          station_g_cd?: string | null
          station_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string
          category?: string
          created_at?: string | null
          has_location?: boolean | null
          id?: string
          is_city_only?: boolean | null
          lat?: number | null
          lng?: number | null
          muni_id?: string | null
          original_language?: string | null
          point?: unknown | null
          pref_id?: string | null
          price?: number | null
          rep_image_url?: string | null
          station_g_cd?: string | null
          station_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_listings_muni_id"
            columns: ["muni_id"]
            isOneToOne: false
            referencedRelation: "municipalities"
            referencedColumns: ["muni_id"]
          },
          {
            foreignKeyName: "fk_listings_station_id"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "stations"
            referencedColumns: ["station_cd"]
          },
          {
            foreignKeyName: "listings_pref_id_fkey"
            columns: ["pref_id"]
            isOneToOne: false
            referencedRelation: "prefectures"
            referencedColumns: ["pref_id"]
          },
          {
            foreignKeyName: "listings_station_g_cd_fkey"
            columns: ["station_g_cd"]
            isOneToOne: false
            referencedRelation: "station_groups"
            referencedColumns: ["station_g_cd"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_edited: boolean | null
          reply_to: string | null
          sender_id: string
          updated_at: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_edited?: boolean | null
          reply_to?: string | null
          sender_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_edited?: boolean | null
          reply_to?: string | null
          sender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reply_to_fkey"
            columns: ["reply_to"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      municipalities: {
        Row: {
          created_at: string | null
          muni_id: string
          muni_name: string
          muni_name_h: string | null
          muni_name_r: string | null
          pref_id: string
        }
        Insert: {
          created_at?: string | null
          muni_id: string
          muni_name: string
          muni_name_h?: string | null
          muni_name_r?: string | null
          pref_id: string
        }
        Update: {
          created_at?: string | null
          muni_id?: string
          muni_name?: string
          muni_name_h?: string | null
          muni_name_r?: string | null
          pref_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "municipalities_pref_id_fkey"
            columns: ["pref_id"]
            isOneToOne: false
            referencedRelation: "prefectures"
            referencedColumns: ["pref_id"]
          },
        ]
      }
      prefectures: {
        Row: {
          created_at: string | null
          pref_id: string
          pref_name: string
          pref_name_h: string | null
          pref_name_r: string | null
        }
        Insert: {
          created_at?: string | null
          pref_id: string
          pref_name: string
          pref_name_h?: string | null
          pref_name_r?: string | null
        }
        Update: {
          created_at?: string | null
          pref_id?: string
          pref_name?: string
          pref_name_h?: string | null
          pref_name_r?: string | null
        }
        Relationships: []
      }
      search_keyword_translations: {
        Row: {
          created_at: string | null
          id: string
          original_keyword: string
          search_count: number | null
          source_locale: string
          target_locale: string
          translated_keyword: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          original_keyword: string
          search_count?: number | null
          source_locale: string
          target_locale: string
          translated_keyword: string
        }
        Update: {
          created_at?: string | null
          id?: string
          original_keyword?: string
          search_count?: number | null
          source_locale?: string
          target_locale?: string
          translated_keyword?: string
        }
        Relationships: []
      }
      station_connections: {
        Row: {
          created_at: string | null
          id: number
          line_cd: string
          station_cd1: string
          station_cd2: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          line_cd: string
          station_cd1: string
          station_cd2: string
        }
        Update: {
          created_at?: string | null
          id?: number
          line_cd?: string
          station_cd1?: string
          station_cd2?: string
        }
        Relationships: [
          {
            foreignKeyName: "station_connections_line_cd_fkey"
            columns: ["line_cd"]
            isOneToOne: false
            referencedRelation: "lines"
            referencedColumns: ["line_id"]
          },
          {
            foreignKeyName: "station_connections_station_cd1_fkey"
            columns: ["station_cd1"]
            isOneToOne: false
            referencedRelation: "stations"
            referencedColumns: ["station_cd"]
          },
          {
            foreignKeyName: "station_connections_station_cd2_fkey"
            columns: ["station_cd2"]
            isOneToOne: false
            referencedRelation: "stations"
            referencedColumns: ["station_cd"]
          },
        ]
      }
      station_groups: {
        Row: {
          address: string | null
          lat: number | null
          lng: number | null
          muni_id: string | null
          point: unknown | null
          pref_id: string | null
          station_g_cd: string
          station_name: string
          station_name_h: string | null
          station_name_r: string | null
        }
        Insert: {
          address?: string | null
          lat?: number | null
          lng?: number | null
          muni_id?: string | null
          point?: unknown | null
          pref_id?: string | null
          station_g_cd: string
          station_name: string
          station_name_h?: string | null
          station_name_r?: string | null
        }
        Update: {
          address?: string | null
          lat?: number | null
          lng?: number | null
          muni_id?: string | null
          point?: unknown | null
          pref_id?: string | null
          station_g_cd?: string
          station_name?: string
          station_name_h?: string | null
          station_name_r?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "station_groups_muni_id_fkey"
            columns: ["muni_id"]
            isOneToOne: false
            referencedRelation: "municipalities"
            referencedColumns: ["muni_id"]
          },
          {
            foreignKeyName: "station_groups_pref_id_fkey"
            columns: ["pref_id"]
            isOneToOne: false
            referencedRelation: "prefectures"
            referencedColumns: ["pref_id"]
          },
        ]
      }
      stations: {
        Row: {
          address: string | null
          created_at: string | null
          e_status: string | null
          lat: number | null
          line_cd: string
          lon: number | null
          muni_id: string
          point: unknown | null
          pref_id: string
          station_cd: string
          station_g_cd: string | null
          station_name: string
          station_name_h: string | null
          station_name_r: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          e_status?: string | null
          lat?: number | null
          line_cd: string
          lon?: number | null
          muni_id: string
          point?: unknown | null
          pref_id: string
          station_cd: string
          station_g_cd?: string | null
          station_name: string
          station_name_h?: string | null
          station_name_r?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          e_status?: string | null
          lat?: number | null
          line_cd?: string
          lon?: number | null
          muni_id?: string
          point?: unknown | null
          pref_id?: string
          station_cd?: string
          station_g_cd?: string | null
          station_name?: string
          station_name_h?: string | null
          station_name_r?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_stations_group"
            columns: ["station_g_cd"]
            isOneToOne: false
            referencedRelation: "station_groups"
            referencedColumns: ["station_g_cd"]
          },
          {
            foreignKeyName: "stations_line_cd_fkey"
            columns: ["line_cd"]
            isOneToOne: false
            referencedRelation: "lines"
            referencedColumns: ["line_id"]
          },
          {
            foreignKeyName: "stations_muni_id_fkey"
            columns: ["muni_id"]
            isOneToOne: false
            referencedRelation: "municipalities"
            referencedColumns: ["muni_id"]
          },
          {
            foreignKeyName: "stations_pref_id_fkey"
            columns: ["pref_id"]
            isOneToOne: false
            referencedRelation: "prefectures"
            referencedColumns: ["pref_id"]
          },
        ]
      }
      translation_queue: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          listing_id: string
          processed_at: string | null
          retry_count: number | null
          source_locale: string
          status: string | null
          target_locales: string[]
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          listing_id: string
          processed_at?: string | null
          retry_count?: number | null
          source_locale: string
          status?: string | null
          target_locales: string[]
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          listing_id?: string
          processed_at?: string | null
          retry_count?: number | null
          source_locale?: string
          status?: string | null
          target_locales?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "translation_queue_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          auto_translate_enabled: boolean | null
          created_at: string | null
          preferred_content_language: string | null
          preferred_ui_language: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_translate_enabled?: boolean | null
          created_at?: string | null
          preferred_content_language?: string | null
          preferred_ui_language?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_translate_enabled?: boolean | null
          created_at?: string | null
          preferred_content_language?: string | null
          preferred_ui_language?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_direct_conversation: {
        Args: { other_user_id: string }
        Returns: string
      }
      generate_point: {
        Args: { lat: number; lng: number }
        Returns: unknown
      }
      get_auth_user: {
        Args: { user_id: string }
        Returns: Json
      }
      get_user_public_info: {
        Args: { p_user_id: string }
        Returns: {
          id: string
          email: string
          display_name: string
          avatar_url: string
        }[]
      }
      get_avatar_url: {
        Args: { user_id: string }
        Returns: string
      }
      get_listing_details: {
        Args: { p_listing_id: string }
        Returns: {
          id: string
          user_id: string
          category: string
          title: string
          body: string
          price: number
          currency: string
          lat: number
          lng: number
          station_g_cd: string
          muni_id: string
          is_city_only: boolean
          has_location: boolean
          rep_image_url: string
          original_language: string
          created_at: string
          updated_at: string
          images: Json
          station: Json
          municipality: Json
          user_info: Json
        }[]
      }
      get_listing_with_translations: {
        Args: { p_listing_id: string; p_preferred_locale?: string }
        Returns: {
          listing: Json
          translations: Json
          preferred_translation: Json
        }[]
      }
      get_pending_translations: {
        Args: { p_limit?: number }
        Returns: {
          id: string
          listing_id: string
          source_locale: string
          target_locales: string[]
          listing_title: string
          listing_body: string
        }[]
      }
      get_station_group_stats: {
        Args: { p_station_g_cd: string }
        Returns: {
          station_g_cd: string
          station_name: string
          total_lines: number
          total_listings: number
          companies: string[]
        }[]
      }
      get_station_groups_with_details: {
        Args: { p_limit?: number; p_offset?: number; p_keyword?: string }
        Returns: {
          station_g_cd: string
          station_name: string
          station_name_h: string
          station_name_r: string
          lat: number
          lng: number
          address: string
          muni_name: string
          muni_name_r: string
          pref_name: string
          pref_name_r: string
          lines: Json
          listing_count: number
        }[]
      }
      get_translation_queue_count: {
        Args: Record<PropertyKey, never>
        Returns: number
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
      mark_translation_completed: {
        Args: { p_queue_id: string }
        Returns: undefined
      }
      mark_translation_failed: {
        Args: { p_queue_id: string; p_error_message: string }
        Returns: undefined
      }
      mark_translation_processing: {
        Args: { p_queue_id: string }
        Returns: undefined
      }
      search_listings: {
        Args: {
          p_q?: string
          p_category?: string
          p_pref_ids?: string[]
          p_muni_ids?: string[]
          p_station_g_cds?: string[]
          p_line_ids?: string[]
          p_min_price?: number
          p_max_price?: number
          p_user_lat?: number
          p_user_lng?: number
          p_max_distance_meters?: number
          p_sort?: string
          p_limit?: number
          p_offset?: number
          p_language?: string
        }
        Returns: {
          id: string
          title: string
          body: string
          category: string
          price: number
          original_language: string
          rep_image_url: string
          user_id: string
          created_at: string
          location: Json
          distance_meters: number
          total_count: number
          translation: Json
        }[]
      }
      search_listings_by_distance: {
        Args:
          | {
              p_lat: number
              p_lng: number
              p_max_distance?: number
              p_limit?: number
              p_offset?: number
              p_category?: string
            }
          | {
              p_lat: number
              p_lng: number
              p_max_distance_meters?: number
              p_pref_id?: string
              p_muni_id?: string
              p_category?: string
              p_price_min?: number
              p_price_max?: number
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
          rep_image_url: string
          lat: number
          lng: number
          municipality_name: string
          station_name: string
          distance_meters: number
        }[]
      }
      search_listings_by_line: {
        Args: {
          p_line_ids: string[]
          p_category?: string
          p_price_min?: number
          p_price_max?: number
          p_limit?: number
          p_offset?: number
        }
        Returns: {
          listing_id: string
          title: string
          body: string
          category: string
          price: number
          created_at: string
          user_id: string
          rep_image_url: string
          has_location: boolean
          is_city_only: boolean
          primary_station_name: string
          municipality_name: string
          prefecture_name: string
          matched_line_name: string
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
      search_listings_by_municipality: {
        Args: {
          p_muni_ids: string[]
          p_category?: string
          p_price_min?: number
          p_price_max?: number
          p_order_by?: string
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
          rep_image_url: string
          primary_station_cd: string
          primary_station_name: string
          primary_line_name: string
          listing_station_lat: number
          listing_station_lng: number
          listing_station_point: unknown
          muni_id: string
          municipality_name: string
          pref_id: string
          prefecture_name: string
          is_city_only: boolean
          has_location: boolean
        }[]
      }
      search_listings_by_prefecture: {
        Args: {
          p_pref_ids: string[]
          p_sort_by: string
          p_sort_order: string
          p_items_per_page: number
          p_page_number: number
        }
        Returns: {
          listing_id: string
          title: string
          price: number
          address: string
          images: string[]
          created_at: string
          updated_at: string
          is_published: boolean
          user_id: string
          station_id: number
          station_name: string
          line_id: number
          line_name: string
          muni_id: number
          municipality_name: string
          pref_id: string
          prefecture_name: string
          station_point: unknown
          has_location: boolean
          is_city_only: boolean
          total_count: number
        }[]
      }
      search_listings_by_station: {
        Args: {
          p_station_cds: string[]
          p_search_radius_meters?: number
          p_category?: string
          p_price_min?: number
          p_price_max?: number
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
          rep_image_url: string
          listing_station_lat: number
          listing_station_lng: number
          listing_station_point: unknown
          searched_station_cd_match: string
          searched_station_name_match: string
          distance_to_match_station_meters: number
          primary_station_cd: string
          primary_station_name: string
          primary_line_name: string
          muni_id: string
          municipality_name: string
          pref_id: string
          prefecture_name: string
          is_city_only: boolean
        }[]
      }
      search_listings_by_station_group: {
        Args: {
          p_station_g_cds: string[]
          p_search_radius_meters?: number
          p_category?: string
          p_price_min?: number
          p_price_max?: number
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
          rep_image_url: string
          station_name: string
          station_lat: number
          station_lng: number
          municipality_name: string
          prefecture_name: string
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
      station_group_line_info: {
        line_name: string | null
        company_name: string | null
      }
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
