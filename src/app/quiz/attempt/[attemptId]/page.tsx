import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { QuizContainer } from '@/components/quiz/quiz-container';
import { QuizContainerV2 } from '@/components/quiz/v2/quiz-container';

interface QuizAttemptPageProps {
    params: { attemptId: string };
    searchParams?: { [key: string]: string | string[] | undefined };
}

export const dynamic = 'force-dynamic';

export default async function QuizAttemptPage({ params, searchParams }: QuizAttemptPageProps) {
    const supabase = createServerComponentClient({ cookies });
    const { attemptId } = params;
    const uiVersion = searchParams?.ui;

    // 1. Fetch the quiz attempt
    const { data: attempt, error: attemptError } = await supabase
        .from('quiz_attempts')
        .select('*, quizzes(*)')
        .eq('id', attemptId)
        .single();

    if (attemptError || !attempt || !attempt.quizzes) {
        notFound();
    }

    const quiz = attempt.quizzes;
    const questionIds = quiz.question_ids;
    const mode = attempt.mode;

    if (!questionIds || questionIds.length === 0) {
        return <div>This quiz has no questions.</div>;
    }

    // 2. Fetch all questions for the quiz
    const { data: questions, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .in('id', questionIds);

    if (questionsError) {
        return <div>Error loading questions: {questionsError.message}</div>;
    }
    
    const orderedQuestions = questionIds.map(id => questions.find(q => q.id === id)).filter(Boolean);

    if (uiVersion === 'v1') {
        return (
            <div className="w-full h-full flex items-center justify-center p-4">
               <QuizContainer questions={orderedQuestions} attemptId={attemptId} mode={mode} />
            </div>
        );
    }

    return (
        <QuizContainerV2 questions={orderedQuestions} attemptId={attemptId} mode={mode} />
    );
}
