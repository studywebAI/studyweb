import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createQuizAndStartAttempt } from '@/app/actions/quiz-actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';

export const dynamic = 'force-dynamic';

async function SubjectsPage() {
  const supabase = createServerComponentClient({ cookies });
  const { data: subjects, error } = await supabase
    .from('subjects')
    .select('id, name');

  if (error) {
    return <p>Error loading subjects: {error.message}</p>;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <h1 className="text-3xl font-bold tracking-tight mb-6">Choose a Subject</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {subjects?.map(subject => (
                <Card key={subject.id}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BookOpen className='w-5 h-5'/>
                            {subject.name}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                       <form action={async () => {
                           'use server';
                           const result = await createQuizAndStartAttempt(subject.id, 'classic');
                           if (result.success && result.redirectUrl) {
                               redirect(result.redirectUrl);
                           }
                           // In a real app, you would handle the error case here.
                       }}>
                           <Button type="submit" className="w-full">Start Classic Quiz</Button>
                       </form>
                       <form action={async () => {
                           'use server';
                           const result = await createQuizAndStartAttempt(subject.id, 'practice');
                           if (result.success && result.redirectUrl) {
                               redirect(result.redirectUrl);
                           }
                           // In a real app, you would handle the error case here.
                       }}>
                           <Button type="submit" className="w-full" variant="outline">Start Practice Quiz</Button>
                       </form>
                    </CardContent>
                </Card>
            ))}
        </div>
    </div>
  );
}

export default SubjectsPage;
