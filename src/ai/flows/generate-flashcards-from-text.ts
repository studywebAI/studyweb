'use server';

/**
 * @fileOverview Generates flashcards from a given text using an AI model.
 *
 * - generateFlashcardsFromText - A function that generates flashcards from text.
 * - GenerateFlashcardsFromTextInput - The input type for the generateFlashcardsFromText function.
 * - GenerateFlashcardsFromTextOutput - The return type for the generateFlashcardsFromText function.
 */

import {z} from 'zod';
import OpenAI from 'openai';
import {
    GenerateFlashcardsFromTextInputSchema,
    GenerateFlashcardsFromTextOutputSchema
} from './schemas';

export type GenerateFlashcardsFromTextInput = z.infer<
  typeof GenerateFlashcardsFromTextInputSchema
>;

export type GenerateFlashcardsFromTextOutput = z.infer<
  typeof GenerateFlashcardsFromTextOutputSchema
>;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


export async function generateFlashcardsFromText(
  input: GenerateFlashcardsFromTextInput
): Promise<GenerateFlashcardsFromTextOutput> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('Missing OPENAI_API_KEY in environment');
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert at creating effective flashcards for learning. Generate a set of flashcards from the following text. Each flashcard should have a front (term or concept), a back (definition or explanation), and an explanation for more context. Respond in JSON format. The response should be a JSON object with a single key "cards", which is an array of flashcard objects.`,
        },
        { role: 'user', content: `Text: ${input.text}` },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });
    
    const content = response.choices[0].message?.content;
    if (!content) {
      throw new Error('No content returned from OpenAI API.');
    }

    const parsed = GenerateFlashcardsFromTextOutputSchema.parse(JSON.parse(content));
    return parsed;

  } catch (error: any) {
    console.error("REAL OPENAI ERROR:", JSON.stringify(error, null, 2));
    throw new Error('Failed to generate flashcards.');
  }
}
