
export type Json = | string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type QuestionType = 'multiple_choice' | 'open_answer' | 'fill_in_the_blank' | 'true_false' | 'drag_and_drop' | 'match_pairs' | 'image_labeling' | 'audio_to_text' | 'text_to_audio' | 'code_output' | 'whiteboard';

export interface Subject {
    id: string;
    name: string;
    owner_user_id: string;
    created_at: string;
    description?: string;
}

export interface Question {
    id: string;
    subject_id?: string;
    question_text: string;
    type: QuestionType;
    difficulty: number;
    answers?: Json;
    correct_answer?: Json;
    metadata?: Json;
    created_at: string;
    author_id?: string;
    explanation?: string;
}

export interface Quiz {
    id: string;
    owner_user_id: string;
    title: string;
    description?: string;
    question_ids?: string[];
    created_at: string;
    settings?: Json;
    subject_id?: string;
}

export interface QuizAttempt {
    id: string;
    user_id: string;
    quiz_id: string;
    start_time: string;
    end_time?: string;
    score?: number;
    difficulty_progression?: Json;
    answers?: Json;
    offline_synced: boolean;
    status: 'in_progress' | 'completed';
    mode: 'classic' | 'practice' | 'survival';
}

export interface Class {
    id: string;
    teacher_id: string;
    name: string;
    description?: string;
    created_at: string;
}

export interface ClassMember {
    class_id: string;
    user_id: string;
    joined_at: string;
}

export interface ClassAssignment {
    id: string;
    quiz_id: string;
    class_id: string;
    deadline?: string;
    teacher_id: string;
    settings_override?: Json;
    status: 'assigned' | 'active' | 'closed';
    created_at: string;
}
