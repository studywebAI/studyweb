-- Create the classes table
CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    class_name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create the class_assignments table
CREATE TABLE IF NOT EXISTS class_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    deadline TIMESTAMPTZ,
    settings JSONB,
    status TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create the teacher_stats table
CREATE TABLE IF NOT EXISTS teacher_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    average_score FLOAT,
    common_mistakes JSONB,
    topic_performance JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Alter the questions table
ALTER TABLE questions ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Alter the quizzes table
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS settings JSONB;

-- Alter the quiz_attempts table
ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS difficulty_progression JSONB;
ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS answers JSONB;
ALTER TABLE quiz_attempts ADD COLUMN IF NOT EXISTS offline_synced BOOLEAN DEFAULT false;
