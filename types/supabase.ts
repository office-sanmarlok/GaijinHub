export interface Database {
  public: {
    Tables: {
      listings: {
        Row: {
          id: string
          user_id: string
          category: string
          title: string
          body: string
          body_en: string | null
          body_zh: string | null
          price: number | null
          city: string | null
          lat: number | null
          lng: number | null
          is_city_only: boolean
          rep_image_url: string | null
          created_at: string
          point: unknown
        }
        Insert: {
          id?: string
          user_id: string
          category: string
          title: string
          body: string
          body_en?: string | null
          body_zh?: string | null
          price?: number | null
          city?: string | null
          lat?: number | null
          lng?: number | null
          is_city_only?: boolean
          rep_image_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category?: string
          title?: string
          body?: string
          body_en?: string | null
          body_zh?: string | null
          price?: number | null
          city?: string | null
          lat?: number | null
          lng?: number | null
          is_city_only?: boolean
          rep_image_url?: string | null
          created_at?: string
        }
      }
      images: {
        Row: {
          id: string
          listing_id: string
          url: string
          order: number
        }
        Insert: {
          id?: string
          listing_id: string
          url: string
          order: number
        }
        Update: {
          id?: string
          listing_id?: string
          url?: string
          order?: number
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
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
  auth: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          created_at: string
        }
        Insert: {
          id: string
          email: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 