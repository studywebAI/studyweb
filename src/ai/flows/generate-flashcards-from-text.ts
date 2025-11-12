/**
 * @fileOverview Generates flashcards from a given text using an AI model.
 *
 * - generateFlashcardsFromText - A function that generates flashcards from text.
 * - GenerateFlashcardsFromTextInput - The input type for the generateFlashcardsFromText function.
 * - GenerateFlashcardsFromTextOutput - The return type for the generateFlashcardsFromText function.
 */

'use server';

import {z} from 'zod';
import {
  GenerateFlashcardsFromTextInputSchema,
  GenerateFlashcardsFromTextOutputSchema,
} from './schemas';
import { callGenerativeAI } from '../unified-ai-handler';


export type GenerateFlashcardsFromTextInput = z.infer<
  typeof GenerateFlashcardsFromTextInputSchema
>;

export type GenerateFlashcardsFromTextOutput = z.infer<
  typeof GenerateFlashcardsFromTextOutputSchema
>;


export async function generateFlashcardsFromText(
  input: GenerateFlashcardsFromTextInput
): Promise<GenerateFlashcardsFromTextOutput> {
  try {
    const systemPrompt = `You are an expert at creating effective flashcards for learning. Generate a set of flashcards from the following text. Respond in JSON format. The response should be a JSON object with a single key "cards", which is an array of flashcard objects, each with "front", "back", and "explanation" keys.`;
    const userPrompt = `Text: ${input.text}`;

    const result = await callGenerativeAI({
        model: input.model,
        apiKey: input.apiKey,
        systemPrompt: systemPrompt,
        userPrompt: userPrompt,
        schema: GenerateFlashcardsFromTextOutputSchema,
    });

    return result;

  } catch (error: any) {
    console.error('Error generating flashcards:', error);
    throw error;
  }
}
