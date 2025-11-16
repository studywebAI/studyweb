'use server';

import { createAgent, createGoogleModel } from '@/ai/agents/factory';

/**
 * Generates a hint for a given question.
 * @param question - The question to get a hint for.
 * @returns The generated hint.
 */
export async function getHint(question: any) {
    try {
        // Using a lightweight model for hints to be fast.
        const hintAgent = createAgent('hint', createGoogleModel('gemini-1.5-flash-latest'));
        const hint = await hintAgent.run(question);
        return { success: true, content: hint };
    } catch (error) {
        console.error('Error in getHint action:', error);
        return { success: false, content: 'Failed to generate hint.' };
    }
}

/**
 * Generates an explanation for a given question and the user's answer.
 * @param question - The question to get an explanation for.
 * @param isCorrect - Whether the user's answer was correct.
 * @param userAnswer - The answer the user provided.
 * @returns The generated explanation.
 */
export async function getExplanation(question: any, isCorrect: boolean, userAnswer: any) {
    try {
        const explainerAgent = createAgent('explainer', createGoogleModel('gemini-1.5-pro-latest'));
        const explanation = await explainerAgent.run(question, isCorrect, userAnswer);
        return { success: true, content: explanation };
    } catch (error) {
        console.error('Error in getExplanation action:', error);
        return { success: false, content: 'Failed to generate explanation.' };
    }
}
