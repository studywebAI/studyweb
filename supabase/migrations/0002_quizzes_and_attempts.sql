-- Supabase Migration: 0002_quizzes_and_attempts.sql
-- This migration creates the tables for managing quizzes and tracking user attempts.

-- 1. Create the 'quizzes' table
-- This table defines a quiz, its questions, and its settings.
CREATE TABLE public.quizzes (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    -- The user who created the quiz, typically a teacher.
    owner_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    -- An array of question IDs that make up this quiz.
    question_ids uuid[] NOT NULL,
    title text NOT NULL,
    description text,
    -- JSON object to store quiz-specific settings.
    -- E.g., { "mode": "survival", "penalty": 5, "time_limit_seconds": 300, "adaptive": true }
    settings jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Add comments to the quizzes table
COMMENT ON TABLE public.quizzes IS 'Defines a quiz as a collection of questions with specific settings.';
COMMENT ON COLUMN public.quizzes.settings IS 'Stores configuration for modes, penalties, time limits, etc.';

-- 2. Create the 'quiz_attempts' table
-- This table records a user's attempt at completing a quiz.
CREATE TABLE public.quiz_attempts (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    quiz_id uuid REFERENCES public.quizzes(id) ON DELETE CASCADE NOT NULL,
    start_time timestamp with time zone DEFAULT now() NOT NULL,
    end_time timestamp with time zone,
    -- The final calculated score for the attempt.
    score real,
    -- JSON array to track how the difficulty changed during an adaptive quiz.
    -- E.g., [{"q_id": "...", "start_diff": 3, "end_diff": 4}, ...]
    difficulty_progression jsonb,
    -- Stores the user's submitted answers for each question.
    -- E.g., { "question_id_1": { "answer": "...", "is_correct": true }, ... }
    answers jsonb,
    -- Tracks if an offline attempt has been successfully synced to the server.
    offline_synced boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Add comments to the quiz_attempts table
COMMENT ON TABLE public.quiz_attempts IS 'Tracks a user\'s specific attempt at a quiz, including answers and score.';
COMMENT ON COLUMN public.quiz_attempts.difficulty_progression IS 'Logs difficulty changes in adaptive mode.';
COMMENT ON COLUMN public.quiz_attempts.answers IS 'Stores the user\'s answers and results for each question in the attempt.';

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies

-- Quizzes Policies
-- Allow users to see quizzes (will be refined later for class assignments).
CREATE POLICY "Allow authenticated users to read quizzes" 
ON public.quizzes 
FOR SELECT 
TO authenticated 
USING (true);

-- Allow owners (teachers) to create and manage their own quizzes.
CREATE POLICY "Allow owner to manage their quizzes" 
ON public.quizzes 
FOR ALL
TO authenticated 
USING (auth.uid() = owner_user_id)
WITH CHECK (auth.uid() = owner_user_id);

-- Quiz Attempts Policies
-- Users can only see their own quiz attempts.
CREATE POLICY "Allow user to see their own attempts" 
ON public.quiz_attempts 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Users can create their own quiz attempts.
CREATE POLICY "Allow user to create their own attempts" 
ON public.quiz_attempts 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own attempts (e.g., to finish them or sync offline data).
CREATE POLICY "Allow user to update their own attempts" 
ON public.quiz_attempts 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);

-- 5. Create triggers for 'updated_at' timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at() 
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW; 
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_quiz_update
  BEFORE UPDATE ON public.quizzes
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_updated_at();
