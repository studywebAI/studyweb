'use server';
/**
 * @fileOverview This file defines a function that imports content and generates a quiz using an AI model.
 */

import {z} from 'zod';
import {
  ImportContentForQuizGenerationInputSchema,
  ImportContentForQuizGenerationOutputSchema,
} from './schemas';
import { callGenerativeAI } from '../unified-ai-handler';


export type ImportContentForQuizGenerationInput = z.infer<
  typeof ImportContentForQuizGenerationInputSchema
>;

export type ImportContentForQuizGenerationOutput = z.infer<
  typeof ImportContentForQuizGenerationOutputSchema
>;


export async function importContentForQuizGeneration(
  input: ImportContentForQuizGenerationInput
): Promise<ImportContentForQuizGenerationOutput> {
  try {
    const systemPrompt = `You are a quiz generator. Generate a quiz from the following content.
    
        The quiz should have ${input.options?.question_count || 10} questions and the difficulty should be ${input.options?.difficulty || 'medium'}.
        
        Respond in JSON format. The response should be a JSON object with a single key "questions", which is an array of question objects.
        `;
    const userPrompt = `Content: ${input.content}`;

    const result = await callGenerativeAI({
        model: input.model,
        apiKey: input.apiKey,
        systemPrompt: systemPrompt,
        userPrompt: userPrompt,
        schema: ImportContentForQuizGenerationOutputSchema,
    });
    
    return result;

  } catch (error: any) {
    console.error('Error generating quiz:', error);
    throw error;
  }
}