'use server';

import { createServerActionClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { QuizAttempt } from '@/types/database';

interface ActionResult {
    success: boolean;
    message: string;
    redirectUrl?: string;
}

export async function createQuizAndStartAttempt(subjectId: string, mode: QuizAttempt['mode'], questionCount: number = 10): Promise<ActionResult> {
    const supabase = createServerActionClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, message: 'Authentication required.' };
    }

    const { data: questions, error: questionsError } = await supabase
        .from('questions')
        .select('id')
        .eq('subject_id', subjectId)
        .limit(questionCount);

    if (questionsError || !questions || questions.length === 0) {
        return { success: false, message: 'Could not find any questions for this subject.' };
    }

    const questionIds = questions.map(q => q.id);

    const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .insert({
            title: `Quiz for subject ${subjectId}`,
            owner_user_id: user.id,
            question_ids: questionIds,
            settings: { mode },
            subject_id: subjectId,
        })
        .select('id')
        .single();

    if (quizError || !quiz) {
        return { success: false, message: `Failed to create quiz: ${quizError?.message}` };
    }

    const { data: attempt, error: attemptError } = await supabase
        .from('quiz_attempts')
        .insert({
            user_id: user.id,
            quiz_id: quiz.id,
            mode: mode 
        })
        .select('id')
        .single();

    if (attemptError || !attempt) {
        return { success: false, message: `Failed to start quiz attempt: ${attemptError?.message}` };
    }

    return { success: true, message: 'Quiz started!', redirectUrl: `/quiz/attempt/${attempt.id}` };
}

interface SaveAnswerResult {
    success: boolean;
    message: string;
    is_correct: boolean;
}

export async function saveAnswer(attemptId: string, questionId: string, answer: any): Promise<SaveAnswerResult> {
    const supabase = createServerActionClient({ cookies });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, message: 'Authentication required.', is_correct: false };
    }

    const { data: questionData, error: questionError } = await supabase
        .from('questions')
        .select('correct_answer')
        .eq('id', questionId)
        .single();

    if (questionError || !questionData) {
        return { success: false, message: 'Question not found.', is_correct: false };
    }

    const is_correct = JSON.stringify(answer) === JSON.stringify(questionData.correct_answer);

    const { data: attemptData, error: attemptFetchError } = await supabase
        .from('quiz_attempts')
        .select('answers')
        .eq('id', attemptId)
        .single();

    if (attemptFetchError || !attemptData) {
        return { success: false, message: 'Quiz attempt not found.', is_correct: false };
    }

    const updatedAnswers = (attemptData.answers || []).filter((a: any) => a.question_id !== questionId);
    updatedAnswers.push({ question_id: questionId, answer, is_correct });

    const { error: updateError } = await supabase
        .from('quiz_attempts')
        .update({ answers: updatedAnswers })
        .eq('id', attemptId);

    if (updateError) {
        return { success: false, message: updateError.message, is_correct: false };
    }

    return { success: true, message: 'Answer saved.', is_correct };
}
