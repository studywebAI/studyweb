/**
 * @fileOverview This file defines a function for generating answers from text using an AI model.
 *
 * - generateAnswerFromText - A function that takes text and history as input and returns an answer.
 * - GenerateAnswerFromTextInput - The input type for the generateAnswerFromText function.
 * - GenerateAnswerFromTextOutput - The return type for the generateAnswerFromtext function.
 */

'use server';

import {z} from 'zod';
import {
  GenerateAnswerFromTextInputSchema,
  GenerateAnswerFromTextOutputSchema,
} from './schemas';
import { callGenerativeAI } from '../unified-ai-handler';

export type GenerateAnswerFromTextInput = z.infer<
  typeof GenerateAnswerFromTextInputSchema
>;

export type GenerateAnswerFromTextOutput = z.infer<
  typeof GenerateAnswerFromTextOutputSchema
>;

export async function generateAnswerFromText(
  input: GenerateAnswerFromTextInput
): Promise<GenerateAnswerFromTextOutput> {
  try {
    const systemPrompt = `You are a helpful AI assistant. Answer the user's question based on the provided conversation history. Respond in JSON format with a single key "answer".`;
    
    // Construct a single prompt from the history and the new question
    const userPrompt = `History: ${JSON.stringify(input.history)}\n\nQuestion: ${input.text}`;

    const result = await callGenerativeAI({
        model: input.model,
        apiKey: input.apiKey,
        systemPrompt: systemPrompt,
        userPrompt: userPrompt,
        schema: GenerateAnswerFromTextOutputSchema,
    });

    return result;
  } catch (error: any) {
    console.error('Error generating answer:', error);
    throw error;
  }
}