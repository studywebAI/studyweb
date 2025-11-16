import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SubjectManager } from '@/components/teacher/subject-manager';
import { CsvUploader } from '@/components/teacher/csv-uploader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { FileQuestion } from 'lucide-react';

export const dynamic = 'force-dynamic'; // Ensure the page is always dynamic

interface Subject {
  id: string;
  name: string;
}

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

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col lg:flex-row items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teacher Dashboard</h1>
          <p className="text-muted-foreground">Manage your subjects and questions here.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        <div className="md:col-span-1">
            <SubjectManager initialSubjects={subjects || []} />
        </div>
        <div className="md:col-span-2 space-y-6">
            <Card>
                 <CardHeader>
                    <CardTitle>Content Management</CardTitle>
                    <CardDescription>Upload questions to your subjects using a CSV file.</CardDescription>
                </CardHeader>
                <CardContent>
                    {subjects && subjects.length > 0 ? (
                        <div className="space-y-4">
                            {subjects.map(subject => (
                                <div key={subject.id} className="p-4 border rounded-lg bg-background">
                                    <h3 className="font-semibold text-lg mb-2">{subject.name}</h3>
                                    <CsvUploader subjectId={subject.id} />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <Alert>
                            <FileQuestion className="h-4 w-4" />
                            <AlertTitle>No Subjects Found</AlertTitle>
                            <AlertDescription>
                                Please create a subject first using the \"Manage Subjects\" panel before you can upload questions.
                            </AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
