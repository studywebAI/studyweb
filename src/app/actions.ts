'use server';

import {
  generateSummaryFromText,
  type GenerateSummaryFromTextInput,
} from '@/ai/flows/generate-summary-from-text';
import {
  generateQuizFromSummary,
  type GenerateQuizFromSummaryInput,
} from '@/ai/flows/generate-quiz-from-summary';
import {
  generateFlashcardsFromText,
  type GenerateFlashcardsFromTextInput,
} from '@/ai/flows/generate-flashcards-from-text';
import {
  generateAnswerFromText,
  type GenerateAnswerFromTextInput,
} from '@/ai/flows/generate-answer-from-text';
import {
    gradeAnswer,
    type GradeAnswerInput,
} from '@/ai/flows/grade-answer';

export async function handleGenerateSummary(input: GenerateSummaryFromTextInput) {
  try {
    return await generateSummaryFromText(input);
  } catch (e: any) {
    console.error('Server action error:', e);
    // Re-throwing the original error to be caught by the client
    throw e;
  }
}

export async function handleGenerateQuiz(input: GenerateQuizFromSummaryInput) {
    try {
        return await generateQuizFromSummary(input);
    } catch (e: any) {
        console.error('Server action error:', e);
        throw e;
    }
}

export async function handleGenerateFlashcards(input: GenerateFlashcardsFromTextInput) {
    try {
        return await generateFlashcardsFromText(input);
    } catch (e: any) {
        console.error('Server action error:', e);
        throw e;
    }
}

export async function handleGenerateAnswer(input: GenerateAnswerFromTextInput) {
    try {
        return await generateAnswerFromText(input);
    } catch (e: any) {
        console.error('Server action error:', e);
        throw e;
    }
}

export async function handleGradeAnswer(input: GradeAnswerInput) {
    try {
        return await gradeAnswer(input);
    } catch (e: any)        {
        console.error('Server action error:', e);
        throw e;
    }
}
