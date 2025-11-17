
import { createServerComponentClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { QuizContainer } from '@/components/quiz/quiz-container';
import { QuizContainerV2 } from '@/components/quiz/v2/quiz-container';
import type { Question, Quiz } from '@/types/database';

interface QuizAttemptPageProps {
    params: { attemptId: string };
    searchParams?: { [key: string]: string | string[] | undefined };
}

export const dynamic = 'force-dynamic';

export default async function QuizAttemptPage({ params, searchParams }: QuizAttemptPageProps) {
    const supabase = createServerComponentClient({ cookies });
    const { attemptId } = params;
    const uiVersion = searchParams?.ui;

    // 1. Fetch the quiz attempt and the associated quiz data
    const { data: attempt, error: attemptError } = await supabase
        .from('quiz_attempts')
        .select('*, quizzes(*)')
        .eq('id', attemptId)
        .single();

    if (attemptError || !attempt || !attempt.quizzes) {
        console.error('Attempt or quiz not found:', attemptError);
        notFound();
    }

    // The quiz data is nested inside the attempt
    const quiz = attempt.quizzes as Quiz;
    const questionIds = quiz.question_ids;

    if (!questionIds || questionIds.length === 0) {
        return <div>This quiz has no questions.</div>;
    }

    // 2. Fetch all questions for the quiz
    const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .in('id', questionIds);

    if (questionsError) {
        return <div>Error loading questions: {questionsError.message}</div>;
    }
    
    // The 'in' filter doesn't guarantee order, so we re-order based on the quiz's question_ids array
    const orderedQuestions = questionIds.map(id => questionsData.find(q => q.id === id)).filter(Boolean) as Question[];

    if (uiVersion === 'v1') {
        return (
            <div className="w-full h-full flex items-center justify-center p-4">
               <QuizContainer questions={orderedQuestions} attemptId={attemptId} mode={attempt.mode} />
            </div>
        );
    }
    
    // Default to the new V2 UI
    return (
        <QuizContainerV2 initialQuestions={orderedQuestions} attempt={attempt} quiz={quiz} />
    );
}
