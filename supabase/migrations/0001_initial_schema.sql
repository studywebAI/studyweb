-- Supabase Migration: 0001_initial_schema.sql
-- This migration creates the initial tables for subjects and questions.

-- 1. Create the 'subjects' table
-- This table categorizes questions into different subjects or topics.
CREATE TABLE public.subjects (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Add comments to the subjects table
COMMENT ON TABLE public.subjects IS 'Stores subject categories for quiz questions.';

-- 2. Create the 'questions' table
-- This is the core table that stores all individual quiz questions.
CREATE TABLE public.questions (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    subject_id uuid REFERENCES public.subjects(id) ON DELETE SET NULL,
    author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL, -- Track who created the question
    question_text text NOT NULL,
    -- The type of question, corresponds to the UI components. E.g., 'multiple_choice', 'true_false', 'whiteboard'
    type text NOT NULL,
    -- Difficulty rating from 0 (easiest) to 10 (hardest), determined by AI or teacher.
    difficulty smallint DEFAULT 3 NOT NULL CHECK (difficulty >= 0 AND difficulty <= 10),
    -- Stores the answer options (for multiple_choice, match_pairs, etc.)
    answers jsonb,
    -- Stores the definitive correct answer(s) for automatic grading.
    correct_answer jsonb,
    -- Stores metadata like image URLs, audio file paths, or hints for specific question types.
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Add comments to the questions table
COMMENT ON TABLE public.questions IS 'Stores individual quiz questions, their types, answers, and metadata.';
COMMENT ON COLUMN public.questions.type IS 'Defines the question format (e.g., multiple_choice, open_answer).';
COMMENT ON COLUMN public.questions.difficulty IS 'AI-generated or manually set difficulty rating from 0 to 10.';
COMMENT ON COLUMN public.questions.answers IS 'JSON object containing the possible answers for the question.';
COMMENT ON COLUMN public.questions.correct_answer IS 'JSON object specifying the correct answer(s).';
COMMENT ON COLUMN public.questions.metadata IS 'JSON object for additional data like image URLs, audio links, or hints.';


-- 3. Enable Row Level Security (RLS)
-- This is a critical security measure to protect user data.
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies
-- These policies define who can access and modify the data.

-- Policy for 'subjects': Authenticated users can read all subjects.
CREATE POLICY "Allow authenticated users to read subjects" 
ON public.subjects 
FOR SELECT 
TO authenticated 
USING (true);

-- Policy for 'questions': Authenticated users can read all questions.
-- In the future, this could be restricted to questions in quizzes they are assigned to.
CREATE POLICY "Allow authenticated users to read questions" 
ON public.questions 
FOR SELECT 
TO authenticated 
USING (true);

-- Policy for 'questions': Users can insert questions.
-- In the future, this will be restricted to users with a 'teacher' role.
CREATE POLICY "Allow users to create their own questions" 
ON public.questions 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = author_id);


-- 5. Create a trigger to automatically update the 'updated_at' timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at() 
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW; 
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_question_update
  BEFORE UPDATE ON public.questions
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_updated_at();

