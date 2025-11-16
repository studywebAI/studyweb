import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SubjectManager } from '@/components/teacher/subject-manager';
import type { Subject, Question } from '@/types/database';
import { AppHeader } from '@/components/app-header';

type SubjectWithQuestions = Subject & { questions: Question[] };

export const dynamic = 'force-dynamic';

export default async function TeacherDashboard() {
  const supabase = createServerComponentClient({ cookies });

  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/');
  }

  const { data: subjects, error } = await supabase
    .from('subjects')
    .select('*, questions(*)')
    .eq('owner_user_id', session.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching subjects:', error);
    // Optionally render an error message to the user
  }

  const subjectsWithQuestions: SubjectWithQuestions[] = subjects || [];

  return (
    <div className="flex flex-col h-screen bg-background">
      <AppHeader />
      <main className="flex-grow overflow-y-auto p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold font-headline tracking-tight">Teacher Dashboard</h1>
            <p className="text-muted-foreground">Manage your subjects, questions, and quizzes.</p>
          </div>
          <SubjectManager initialSubjects={subjectsWithQuestions} />
        </div>
      </main>
    </div>
  );
}
