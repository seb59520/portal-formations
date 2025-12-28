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
      courses: {
        Row: {
          id: string
          title: string
          description: string | null
          status: string
          access_type: string
          price_cents: number | null
          currency: string | null
          is_paid: boolean
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          status?: string
          access_type?: string
          price_cents?: number | null
          currency?: string | null
          is_paid?: boolean
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          status?: string
          access_type?: string
          price_cents?: number | null
          currency?: string | null
          is_paid?: boolean
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      enrollments: {
        Row: {
          id: string
          user_id: string
          course_id: string
          status: string
          source: string
          enrolled_at: string
        }
        Insert: {
          id?: string
          user_id: string
          course_id: string
          status?: string
          source?: string
          enrolled_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          course_id?: string
          status?: string
          source?: string
          enrolled_at?: string
        }
      }
      game_scores: {
        Row: {
          id: string
          user_id: string
          course_id: string
          item_id: string
          score: number
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          course_id: string
          item_id: string
          score: number
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          course_id?: string
          item_id?: string
          score?: number
          metadata?: Json | null
          created_at?: string
        }
      }
      items: {
        Row: {
          id: string
          module_id: string
          type: string
          title: string
          content: Json | null
          asset_path: string | null
          external_url: string | null
          position: number
          published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          module_id: string
          type: string
          title: string
          content?: Json | null
          asset_path?: string | null
          external_url?: string | null
          position?: number
          published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          module_id?: string
          type?: string
          title?: string
          content?: Json | null
          asset_path?: string | null
          external_url?: string | null
          position?: number
          published?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      modules: {
        Row: {
          id: string
          course_id: string
          title: string
          position: number
          created_at: string
        }
        Insert: {
          id?: string
          course_id: string
          title: string
          position?: number
          created_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          title?: string
          position?: number
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          role: string
          full_name: string | null
          created_at: string
        }
        Insert: {
          id: string
          role?: string
          full_name?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          role?: string
          full_name?: string | null
          created_at?: string
        }
      }
      submissions: {
        Row: {
          id: string
          user_id: string
          item_id: string
          answer_text: string | null
          answer_json: Json | null
          file_path: string | null
          status: string
          grade: number | null
          submitted_at: string
          graded_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          item_id: string
          answer_text?: string | null
          answer_json?: Json | null
          file_path?: string | null
          status?: string
          grade?: number | null
          submitted_at?: string
          graded_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          item_id?: string
          answer_text?: string | null
          answer_json?: Json | null
          file_path?: string | null
          status?: string
          grade?: number | null
          submitted_at?: string
          graded_at?: string | null
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
