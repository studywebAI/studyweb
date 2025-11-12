/**
 * @fileOverview This file defines a function for generating a quiz from a summary using an AI model.
 */

'use server';

import {z} from 'zod';
import {
  GenerateQuizFromSummaryInputSchema,
  GenerateQuizFromSummaryOutputSchema,
} from './schemas';
import { callGenerativeAI } from '../unified-ai-handler';


export type GenerateQuizFromSummaryInput = z.infer<
  typeof GenerateQuizFromSummaryInputSchema
>;
export type GenerateQuizFromSummaryOutput = z.infer<
  typeof GenerateQuizFromSummaryOutputSchema
>;


/**
 * Generates a quiz from a given summary content.
 * @param input - The input containing the summary content and options for quiz generation.
 * @returns A promise that resolves to the generated quiz.
 */
export async function generateQuizFromSummary(
  input: GenerateQuizFromSummaryInput
): Promise<GenerateQuizFromSummaryOutput> {
  try {
    const systemPrompt = `You are a quiz generator. Generate a quiz based on the following summary. Respond in JSON format. The response should be a JSON object with a single key "questions", which is an array of question objects. Each question object should have "question", "options" (an array of strings), "correctIndex" (a number), and "explanation" keys.
    
        Options:
        - Number of Questions: ${input.options?.questionCount || 10}
        - Difficulty: ${input.options?.difficulty || 'medium'}
      `;
    const userPrompt = `Summary: ${input.summaryContent}`;

    const result = await callGenerativeAI({
        model: input.model,
        apiKey: input.apiKey,
        systemPrompt: systemPrompt,
        userPrompt: userPrompt,
        schema: GenerateQuizFromSummaryOutputSchema,
    });
    
    return result;

  } catch (error: any) {
    console.error('Error generating quiz:', error);
    throw error;
  }
}
