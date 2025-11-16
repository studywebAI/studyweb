import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SubjectManager } from '@/components/teacher/subject-manager';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getQuestionsForSubject } from '@/app/actions/teacher-actions';
import type { Subject, Question } from '@/types/database';


export const dynamic = 'force-dynamic'; // Ensure the page is always dynamic

type SubjectWithQuestions = Subject & { questions: Question[] };

export default async function TeacherDashboardPage() {
  const supabase = createServerComponentClient({ cookies });

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    redirect('/login'); // Or your login page
  }

  const { data: subjects, error } = await supabase
    .from('subjects')
    .select('id, name')
    .eq('owner_user_id', session.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return <div className="p-4">Error loading subjects: {error.message}</div>;
  }
  
  const subjectsWithQuestions: SubjectWithQuestions[] = await Promise.all(
    (subjects || []).map(async (subject) => {
        const questionsResult = await getQuestionsForSubject(subject.id);
        return {
            ...subject,
            questions: questionsResult.success ? questionsResult.questions : []
        }
    })
  );


  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col lg:flex-row items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teacher Dashboard</h1>
          <p className="text-muted-foreground">Manage your subjects and questions here.</p>
        </div>
      </div>
      <SubjectManager initialSubjects={subjectsWithQuestions || []} />
    </div>
  );
}
