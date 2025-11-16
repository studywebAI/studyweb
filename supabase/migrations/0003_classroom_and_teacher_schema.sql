-- Supabase Migration: 0003_classroom_and_teacher_schema.sql
-- This migration establishes the schema for classroom management and teacher-specific features.

-- 1. Create the 'classes' table
-- This table allows teachers to group students into classes.
CREATE TABLE public.classes (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    teacher_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    class_name text NOT NULL,
    description text,
    join_code text UNIQUE, -- A simple, shareable code for students to join a class
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

COMMENT ON TABLE public.classes IS 'Stores classroom groups managed by teachers.';
COMMENT ON COLUMN public.classes.join_code IS 'A unique, shareable code for students to join the class.';

-- 2. Create the 'class_members' junction table
-- This table links students (users) to classes.
CREATE TABLE public.class_members (
    class_id uuid REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
    student_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    joined_at timestamp with time zone DEFAULT now() NOT NULL,
    PRIMARY KEY (class_id, student_id)
);

COMMENT ON TABLE public.class_members IS 'Junction table linking students to their classes.';

-- 3. Create the 'class_assignments' table
-- This table assigns a quiz to a class with a specific deadline and settings.
CREATE TABLE public.class_assignments (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    quiz_id uuid REFERENCES public.quizzes(id) ON DELETE CASCADE NOT NULL,
    class_id uuid REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
    teacher_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    deadline timestamp with time zone,
    -- Assignment-specific settings that can override the base quiz settings.
    -- E.g., { "mode": "exam", "time_limit_seconds": 1800 }
    settings jsonb,
    status text DEFAULT 'assigned' NOT NULL, -- e.g., 'assigned', 'in_progress', 'completed'
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

COMMENT ON TABLE public.class_assignments IS 'Assigns quizzes to classes with deadlines and custom settings.';

-- 4. Create a (placeholder) 'teacher_stats' table
-- This will be used for aggregated analytics for teachers.
CREATE TABLE public.teacher_stats (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    teacher_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    subject_id uuid REFERENCES public.subjects(id) ON DELETE SET NULL,
    quiz_id uuid REFERENCES public.quizzes(id) ON DELETE SET NULL,
    class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
    -- E.g., { "average_score": 85.5, "common_mistakes": {...} }
    stats_data jsonb,
    generated_at timestamp with time zone DEFAULT now() NOT NULL
);

COMMENT ON TABLE public.teacher_stats IS 'Stores aggregated statistics for teachers about quiz/student performance.';


-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_stats ENABLE ROW LEVEL SECURITY;


-- 6. Create RLS Policies

-- Classes Policies
-- Teachers can manage their own classes.
CREATE POLICY "Teachers can manage their own classes" 
ON public.classes FOR ALL 
TO authenticated 
USING (auth.uid() = teacher_id) 
WITH CHECK (auth.uid() = teacher_id);

-- Class Members Policies
-- Teachers can manage members of their own classes.
CREATE POLICY "Teachers can manage their class members" 
ON public.class_members FOR ALL 
TO authenticated 
USING ( (SELECT teacher_id FROM public.classes WHERE id = class_id) = auth.uid() );

-- Students can see the classes they are a member of.
CREATE POLICY "Students can see their own class memberships" 
ON public.class_members FOR SELECT 
TO authenticated 
USING (auth.uid() = student_id);

-- Students can join a class (insert themselves).
CREATE POLICY "Students can join classes" 
ON public.class_members FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = student_id);

-- Class Assignments Policies
-- Teachers can manage assignments for their own classes.
CREATE POLICY "Teachers can manage their class assignments" 
ON public.class_assignments FOR ALL 
TO authenticated 
USING (auth.uid() = teacher_id);

-- Students can see assignments for classes they are in.
CREATE POLICY "Students can see assignments for their classes" 
ON public.class_assignments FOR SELECT 
TO authenticated 
USING ( class_id IN (SELECT class_id FROM public.class_members WHERE student_id = auth.uid()) );

-- Teacher Stats Policies
-- Teachers can view their own stats.
CREATE POLICY "Teachers can view their own stats" 
ON public.teacher_stats FOR SELECT 
TO authenticated 
USING (auth.uid() = teacher_id);
