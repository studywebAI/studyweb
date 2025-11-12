/**
 * @fileOverview This file defines a function for generating concise summaries from text using an AI model.
 */

'use server';

import {z} from 'zod';
import {
  GenerateSummaryFromTextInputSchema,
  GenerateSummaryFromTextOutputSchema,
} from './schemas';
import { callGenerativeAI } from '../unified-ai-handler';

export type GenerateSummaryFromTextInput = z.infer<
  typeof GenerateSummaryFromTextInputSchema
>;

export type GenerateSummaryFromTextOutput = z.infer<
  typeof GenerateSummaryFromTextOutputSchema
>;


export async function generateSummaryFromText(
  input: GenerateSummaryFromTextInput
): Promise<GenerateSummaryFromTextOutput> {
  try {
    const systemPrompt = `You are an expert in summarizing text. Generate a concise summary of the provided text. Respond in JSON format. The response should be a JSON object with a single key "summary".`;
    const userPrompt = `Text: ${input.text}`;

    const result = await callGenerativeAI({
        model: input.model,
        apiKey: input.apiKey,
        systemPrompt: systemPrompt,
        userPrompt: userPrompt,
        schema: GenerateSummaryFromTextOutputSchema,
    });
    
    return result;

  } catch (error: any) => {
    console.error('Error generating summary:', error);
    throw error;
  }
}