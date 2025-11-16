
-- Create a custom type for question types
CREATE TYPE question_type AS ENUM (
    'multiple_choice',
    'open_answer',
    'fill_in_the_blank',
    'true_false',
    'drag_and_drop_order',
    'match_pairs',
    'image_labeling',
    'audio_to_text',
    'text_to_audio',
    'code_output',
    'whiteboard'
);

-- Table: subjects
-- For categorizing questions and quizzes.
CREATE TABLE subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    owner_user_id UUID REFERENCES auth.users(id)
);
COMMENT ON TABLE subjects IS 'Stores subject categories for organizing content.';

-- Table: questions
-- The core table for every individual question.
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
    question_text TEXT NOT NULL,
    type question_type NOT NULL,
    difficulty REAL CHECK (difficulty >= 0 AND difficulty <= 10),
    answers JSONB, -- Stores options for multiple choice, pairs for matching, etc.
    correct_answer JSONB NOT NULL, -- Can be a string, a number, or a JSON object depending on the question type.
    metadata JSONB, -- For storing image URLs, audio file paths, or other non-essential data.
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    author_id UUID REFERENCES auth.users(id)
);
COMMENT ON TABLE questions IS 'Contains all individual questions that can be used in quizzes.';


-- Table: quizzes
-- Represents a collection of questions that form a single quiz.
CREATE TABLE quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    owner_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    question_ids UUID[], -- An array of question IDs that make up this quiz.
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    settings JSONB -- Stores settings like available modes, penalty configuration, time limits, etc.
);
COMMENT ON TABLE quizzes IS 'Defines a quiz as a set of questions with specific settings.';


-- Table: quiz_attempts
-- Records every attempt a user makes on a quiz.
CREATE TABLE quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE NOT NULL,
    start_time TIMESTAMPTZ NOT NULL DEFAULT now(),
    end_time TIMESTAMPTZ,
    score REAL,
    difficulty_progression JSONB, -- Stores an array of difficulty adjustments during an adaptive session.
    answers JSONB, -- Stores the user's submitted answers for each question, e.g., [{"question_id": "...", "answer": "...", "is_correct": true}].
    offline_synced BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE quiz_attempts IS 'Logs each time a user attempts a quiz, storing their answers and results.';


-- Table: classes
-- For teachers to group students.
CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_name TEXT NOT NULL,
    teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE classes IS 'Represents a classroom or group of students managed by a teacher.';

-- Table: class_members
-- A many-to-many relationship linking students to classes.
CREATE TABLE class_members (
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (class_id, user_id)
);
COMMENT ON TABLE class_members IS 'Links users (students) to classes.';


-- Table: class_assignments
-- Assigns a quiz to a class with a deadline and specific settings.
CREATE TABLE class_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE NOT NULL,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
    teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Denormalized for easier access.
    deadline TIMESTAMPTZ,
    settings JSONB, -- Overrides quiz settings for this specific assignment (e.g., forcing a specific mode).
    status TEXT DEFAULT 'assigned', -- e.g., 'assigned', 'in_progress', 'completed'.
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE class_assignments IS 'Assigns a quiz to a class with a deadline and specific rules.';
