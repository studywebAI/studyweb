// src/ai/flows/generate-flashcards-from-text.ts
'use server';

/**
 * @fileOverview Generates flashcards from a given text.
 *
 * - generateFlashcardsFromText - A function that generates flashcards from text.
 * - GenerateFlashcardsFromTextInput - The input type for the generateFlashcardsFromText function.
 * - GenerateFlashcardsFromTextOutput - The return type for the generateFlashcardsFromText function.
 */

import {ai} from '@/ai/genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {z} from 'genkit';

const GenerateFlashcardsFromTextInputSchema = z.object({
  text: z.string().describe('The text to generate flashcards from.'),
});
export type GenerateFlashcardsFromTextInput = z.infer<
  typeof GenerateFlashcardsFromTextInputSchema
>;

const GenerateFlashcardsFromTextOutputSchema = z.object({
  cards: z.array(
    z.object({
      front: z.string().describe('The term or concept on the front of the flashcard.'),
      back: z.string().describe('The definition or explanation on the back of the flashcard.'),
      explanation: z.string().describe('Additional context or explanation.'),
    })
  ).describe('The generated flashcards.'),
});
export type GenerateFlashcardsFromTextOutput = z.infer<
  typeof GenerateFlashcardsFromTextOutputSchema
>;

export async function generateFlashcardsFromText(
  input: GenerateFlashcardsFromTextInput
): Promise<GenerateFlashcardsFromTextOutput> {
  return generateFlashcardsFromTextFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateFlashcardsFromTextPrompt',
  input: {schema: GenerateFlashcardsFromTextInputSchema},
  output: {schema: GenerateFlashcardsFromTextOutputSchema},
  model: googleAI.model('gemini-1.5-flash'),
  prompt: `You are an expert at creating effective flashcards for learning.

  Generate a set of flashcards from the following text. Each flashcard should have a front (term or concept), a back (definition or explanation), and an optional explanation for more context.

  Text: {{{text}}}
  `,
});

const generateFlashcardsFromTextFlow = ai.defineFlow(
  {
    name: 'generateFlashcardsFromTextFlow',
    inputSchema: GenerateFlashcardsFromTextInputSchema,
    outputSchema: GenerateFlashcardsFromTextOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
