'use server';

/**
 * @fileOverview Generates flashcards from a given text using the OpenAI API.
 *
 * - generateFlashcardsFromText - A function that generates flashcards from text.
 * - GenerateFlashcardsFromTextInput - The input type for the generateFlashcardsFromText function.
 * - GenerateFlashcardsFromTextOutput - The return type for the generateFlashcardsFromText function.
 */

import {z} from 'genkit';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const GenerateFlashcardsFromTextInputSchema = z.object({
  text: z.string().describe('The text to generate flashcards from.'),
});
export type GenerateFlashcardsFromTextInput = z.infer<
  typeof GenerateFlashcardsFromTextInputSchema
>;

const GenerateFlashcardsFromTextOutputSchema = z.object({
  cards: z
    .array(
      z.object({
        front: z
          .string()
          .describe('The term or concept on the front of the flashcard.'),
        back: z
          .string()
          .describe('The definition or explanation on the back of the flashcard.'),
        explanation: z
          .string()
          .describe('Additional context or explanation.'),
      })
    )
    .describe('The generated flashcards.'),
});
export type GenerateFlashcardsFromTextOutput = z.infer<
  typeof GenerateFlashcardsFromTextOutputSchema
>;

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
          content: `You are an expert at creating effective flashcards for learning. You must respond with a valid JSON object matching the following schema:
            {
              "cards": [
                {
                  "front": "Term or concept",
                  "back": "Definition or explanation",
                  "explanation": "Additional context"
                }
              ]
            }
            `,
        },
        {
          role: 'user',
          content: `Generate a set of flashcards from the following text. Each flashcard should have a front (term or concept), a back (definition or explanation), and an optional explanation for more context.\n\nText: ${input.text}`,
        },
      ],
      response_format: {type: 'json_object'},
    });

    const content = response.choices[0].message?.content;
    if (!content) {
      throw new Error('No content returned from OpenAI.');
    }

    const parsed = JSON.parse(content);
    return GenerateFlashcardsFromTextOutputSchema.parse(parsed);
  } catch (error: any) {
    console.error("REAL OPENAI ERROR:", JSON.stringify(error, null, 2));
    throw error;
  }
}