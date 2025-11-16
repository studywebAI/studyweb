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
import {
    generateHintForCard,
    type GenerateHintInput,
} from '@/ai/flows/generate-hint-for-card';

export async function handleGenerateSummary(input: Omit<GenerateSummaryFromTextInput, 'apiKey'>) {
  try {
    return await generateSummaryFromText(input);
  } catch (e: any) {
    console.error('Server action error:', e);
    // Re-throwing the original error to be caught by the client
    throw e;
  }
}

export async function handleGenerateQuiz(input: Omit<GenerateQuizFromSummaryInput, 'apiKey'>) {
    try {
        return await generateQuizFromSummary(input);
    } catch (e: any) {
        console.error('Server action error:', e);
        throw e;
    }
}

export async function handleGenerateFlashcards(input: Omit<GenerateFlashcardsFromTextInput, 'apiKey'>) {
    try {
        return await generateFlashcardsFromText(input);
    } catch (e: any) {
        console.error('Server action error:', e);
        throw e;
    }
}

export async function handleGenerateAnswer(input: Omit<GenerateAnswerFromTextInput, 'apiKey'>) {
    try {
        return await generateAnswerFromText(input);
    } catch (e: any) {
        console.error('Server action error:', e);
        throw e;
    }
}

export async function handleGradeAnswer(input: Omit<GradeAnswerInput, 'apiKey'>) {
    try {
        return await gradeAnswer(input);
    } catch (e: any)        {
        console.error('Server action error:', e);
        throw e;
    }
}

export async function handleGenerateHint(input: Omit<GenerateHintInput, 'apiKey'>) {
    try {
        return await generateHintForCard(input);
    } catch (e: any) {
        console.error('Server action error:', e);
        throw e;
    }
}
