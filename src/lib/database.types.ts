
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
      subjects: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
      }
      questions: {
        Row: {
          id: string
          subject_id: string | null
          question_text: string
          type: string
          difficulty: number | null
          answers: Json
          correct_answer: Json
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          subject_id?: string | null
          question_text: string
          type: string
          difficulty?: number | null
          answers: Json
          correct_answer: Json
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          subject_id?: string | null
          question_text?: string
          type?: string
          difficulty?: number | null
          answers?: Json
          correct_answer?: Json
          metadata?: Json | null
          created_at?: string
        }
      }
      quizzes: {
        Row: {
          id: string
          owner_user_id: string
          question_ids: string[] | null
          created_at: string
          settings: Json | null
        }
        Insert: {
          id?: string
          owner_user_id: string
          question_ids?: string[] | null
          created_at?: string
          settings?: Json | null
        }
        Update: {
          id?: string
          owner_user_id?: string
          question_ids?: string[] | null
          created_at?: string
          settings?: Json | null
        }
      }
      quiz_attempts: {
        Row: {
          id: string
          user_id: string
          quiz_id: string
          start_time: string
          end_time: string | null
          score: number | null
          difficulty_progression: Json | null
          answers: Json | null
          offline_synced: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          quiz_id: string
          start_time?: string
          end_time?: string | null
          score?: number | null
          difficulty_progression?: Json | null
          answers?: Json | null
          offline_synced?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          quiz_id?: string
          start_time?: string
          end_time?: string | null
          score?: number | null
          difficulty_progression?: Json | null
          answers?: Json | null
          offline_synced?: boolean
          created_at?: string
        }
      }
      classes: {
        Row: {
          id: string
          teacher_id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          teacher_id: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          teacher_id?: string
          name?: string
          created_at?: string
        }
      }
      class_assignments: {
        Row: {
          id: string
          quiz_id: string
          class_id: string
          deadline: string | null
          teacher_id: string
          settings: Json | null
          status: string | null
          created_at: string
        }
        Insert: {
          id?: string
          quiz_id: string
          class_id: string
          deadline?: string | null
          teacher_id: string
          settings?: Json | null
          status?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          quiz_id?: string
          class_id?: string
          deadline?: string | null
          teacher_id?: string
          settings?: Json | null
          status?: string | null
          created_at?: string
        }
      }
      teacher_stats: {
        Row: {
          id: string
          quiz_id: string
          class_id: string
          average_score: number | null
          common_mistakes: Json | null
          updated_at: string
        }
        Insert: {
          id?: string
          quiz_id: string
          class_id: string
          average_score?: number | null
          common_mistakes?: Json | null
          updated_at?: string
        }
        Update: {
          id?: string
          quiz_id?: string
          class_id?: string
          average_score?: number | null
          common_mistakes?: Json | null
          updated_at?: string
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
