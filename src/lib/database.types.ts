
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
          owner_user_id: string,
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          owner_user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          owner_user_id?: string
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
          author_id: string
          explanation?: string;
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
          author_id: string
          explanation?: string;
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
          author_id?: string
          explanation?: string;
        }
      }
      quizzes: {
        Row: {
          id: string
          owner_user_id: string
          question_ids: string[] | null
          created_at: string
          settings: Json | null
          title: string,
        }
        Insert: {
          id?: string
          owner_user_id: string
          question_ids?: string[] | null
          created_at?: string
          settings?: Json | null
          title: string,
        }
        Update: {
          id?: string
          owner_user_id?: string
          question_ids?: string[] | null
          created_at?: string
          settings?: Json | null
          title?: string,
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
          mode: "classic" | "practice" | "survival";
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
          mode: "classic" | "practice" | "survival";
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
          mode?: "classic" | "practice" | "survival";
        }
      }
      sessions: {
        Row: {
            id: string
            user_id: string
            created_at: string
            title: string
            type: 'summary' | 'flashcards' | 'quiz' | 'answer';
            source_text: string;
            content: Json;
        },
        Insert: {
            id?: string
            user_id: string
            created_at?: string
            title: string
            type: 'summary' | 'flashcards' | 'quiz' | 'answer';
            source_text: string;
            content: Json;
        },
        Update: {
            id?: string
            user_id?: string
            created_at?: string
            title?: string
            type?: 'summary' | 'flashcards' | 'quiz' | 'answer';
            source_text?: string;
            content?: Json;
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
