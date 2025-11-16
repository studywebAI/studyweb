-- Create subjects table
CREATE TABLE "public"."subjects" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE "public"."subjects" ADD CONSTRAINT "subjects_pkey" PRIMARY KEY USING INDEX ON "public"."subjects" ("id");

-- Create an ENUM type for question types
CREATE TYPE "public"."question_type" AS ENUM (
    'multiple_choice',
    'open_answer',
    'fill_in_the_blank',
    'true_false',
    'drag_and_drop',
    'match_pairs',
    'image_labeling',
    'audio_to_text',
    'text_to_audio',
    'code_output',
    'whiteboard'
);

-- Create questions table
CREATE TABLE "public"."questions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "subject_id" "uuid",
    "question_text" "text" NOT NULL,
    "type" "public"."question_type" NOT NULL,
    "difficulty" smallint DEFAULT 5 NOT NULL,
    "answers" "jsonb",
    "correct_answer" "jsonb",
    "metadata" "jsonb", -- For things like image_url, audio_url, code_language, etc.
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "author_id" "uuid" REFERENCES "auth"."users"("id")
);

ALTER TABLE "public"."questions" ADD CONSTRAINT "questions_pkey" PRIMARY KEY USING INDEX ON "public"."questions" ("id");
ALTER TABLE "public"."questions" ADD CONSTRAINT "questions_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE SET NULL;
ALTER TABLE "public"."questions" ADD CONSTRAINT "questions_difficulty_check" CHECK (((difficulty >= 0) AND (difficulty <= 10)));

-- Create quizzes table
CREATE TABLE "public"."quizzes" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "owner_user_id" "uuid" NOT NULL REFERENCES "auth"."users"("id"),
    "title" "text" NOT NULL,
    "description" "text",
    "question_ids" "uuid"[],
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "settings" "jsonb" -- For modes, penalty, time limit, etc.
);

ALTER TABLE "public"."quizzes" ADD CONSTRAINT "quizzes_pkey" PRIMARY KEY USING INDEX ON "public"."quizzes" ("id");

-- Create quiz_attempts table
CREATE TABLE "public"."quiz_attempts" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL REFERENCES "auth"."users"("id"),
    "quiz_id" "uuid" NOT NULL REFERENCES "public"."quizzes"("id") ON DELETE CASCADE,
    "start_time" timestamp with time zone DEFAULT "now"() NOT NULL,
    "end_time" timestamp with time zone,
    "score" "real",
    "difficulty_progression" "jsonb",
    "answers" "jsonb", -- [{"question_id": "...", "answer": "...", "is_correct": ...}, ...]
    "offline_synced" boolean DEFAULT true NOT NULL,
    "status" "text" DEFAULT 'in_progress' NOT NULL -- in_progress, completed
);

ALTER TABLE "public"."quiz_attempts" ADD CONSTRAINT "quiz_attempts_pkey" PRIMARY KEY USING INDEX ON "public"."quiz_attempts" ("id");

-- Create classes table
CREATE TABLE "public"."classes" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "teacher_id" "uuid" NOT NULL REFERENCES "auth"."users"("id"),
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE "public"."classes" ADD CONSTRAINT "classes_pkey" PRIMARY KEY USING INDEX ON "public"."classes" ("id");

-- Create class_members table (junction table for classes and users/students)
CREATE TABLE "public"."class_members" (
    "class_id" "uuid" NOT NULL REFERENCES "public"."classes"("id") ON DELETE CASCADE,
    "user_id" "uuid" NOT NULL REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    "joined_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    PRIMARY KEY ("class_id", "user_id")
);

-- Create class_assignments table
CREATE TABLE "public"."class_assignments" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "quiz_id" "uuid" NOT NULL REFERENCES "public"."quizzes"("id") ON DELETE CASCADE,
    "class_id" "uuid" NOT NULL REFERENCES "public"."classes"("id") ON DELETE CASCADE,
    "deadline" timestamp with time zone,
    "teacher_id" "uuid" NOT NULL REFERENCES "auth"."users"("id"),
    "settings_override" "jsonb", -- Override quiz settings for this specific assignment
    "status" "text" DEFAULT 'assigned' NOT NULL, -- assigned, active, closed
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE "public"."class_assignments" ADD CONSTRAINT "class_assignments_pkey" PRIMARY KEY USING INDEX ON "public"."class_assignments" ("id");

-- Enable RLS for all tables
ALTER TABLE "public"."subjects" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."questions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."quizzes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."quiz_attempts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."classes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."class_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."class_assignments" ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES --
-- Users can see all subjects
CREATE POLICY "Allow read access to all users" ON "public"."subjects" FOR SELECT USING (true);

-- Users can see all public/shared questions
CREATE POLICY "Allow read access to all users" ON "public"."questions" FOR SELECT USING (true); -- Simplified for now
CREATE POLICY "Allow insert for authenticated users" ON "public"."questions" FOR INSERT TO authenticated WITH CHECK (true);

-- Users can only see/edit their own quizzes
CREATE POLICY "Allow full access for quiz owners" ON "public"."quizzes" FOR ALL
USING (auth.uid() = owner_user_id)
WITH CHECK (auth.uid() = owner_user_id);

-- Users can only see/edit their own quiz attempts
CREATE POLICY "Allow full access for attempt owners" ON "public"."quiz_attempts" FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Teachers can manage their own classes
CREATE POLICY "Allow full access for class teachers" ON "public"."classes" FOR ALL
USING (auth.uid() = teacher_id)
WITH CHECK (auth.uid() = teacher_id);

-- Students can see classes they are members of
CREATE POLICY "Allow read access for class members" ON "public"."classes" FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.class_members
    WHERE class_id = id AND user_id = auth.uid()
));

-- Users can see/manage their own membership. Teachers can manage all memberships for their class.
CREATE POLICY "Allow teacher to manage members" ON "public"."class_members" FOR ALL
USING (EXISTS (
    SELECT 1 FROM public.classes
    WHERE id = class_id AND teacher_id = auth.uid()
));

CREATE POLICY "Allow user to manage their own membership" ON "public"."class_members" FOR ALL
USING (user_id = auth.uid());


-- Teachers can manage assignments for their classes.
CREATE POLICY "Allow teacher to manage assignments" ON "public"."class_assignments" FOR ALL
USING (auth.uid() = teacher_id)
WITH CHECK (auth.uid() = teacher_id);

-- Students can see assignments for classes they are in.
CREATE POLICY "Allow students to see their assignments" ON "public"."class_assignments" FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.class_members
    WHERE class_id = class_assignments.class_id AND user_id = auth.uid()
));
