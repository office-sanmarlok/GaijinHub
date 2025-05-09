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
          id: string
          title: string
          body: string
          price: number | null
          category: string | null
          city: string | null
          rep_image_url: string | null
          user_id: string
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          body: string
          price?: number | null
          category?: string | null
          city?: string | null
          rep_image_url?: string | null
          user_id: string
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          body?: string
          price?: number | null
          category?: string | null
          city?: string | null
          rep_image_url?: string | null
          user_id?: string
          created_at?: string
          updated_at?: string | null
        }
      }
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
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 