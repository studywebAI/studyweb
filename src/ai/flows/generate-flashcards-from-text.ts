'use server';

/**
 * @fileOverview Generates flashcards from a given text using the OpenAI API.
 *
 * - generateFlashcardsFromText - A function that generates flashcards from text.
 * - GenerateFlashcardsFromTextInput - The input type for the generateFlashcardsFromText function.
 * - GenerateFlashcardsFromTextOutput - The return type for the generateFlashcardsFromText function.
 */

import {z} from 'genkit';

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
  const prompt = `You are an expert at creating effective flashcards for learning.

  Generate a set of flashcards from the following text. Each flashcard should have a front (term or concept), a back (definition or explanation), and an optional explanation for more context.

  Text: ${input.text}
  `;

  const systemPrompt = `You must respond with a valid JSON object matching the following schema:
  ${JSON.stringify(
    GenerateFlashcardsFromTextOutputSchema.parse({
      cards: [
        {
          front: '',
          back: '',
          explanation: '',
        },
      ],
    })
  )}`;

  try {
    const response = await fetch(
      'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {role: 'system', content: systemPrompt},
            {role: 'user', content: prompt}
          ],
          response_format: {type: 'json_object'},
        }),
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `OpenAI API request failed with status ${response.status}: ${errorBody}`
      );
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    try {
      const parsed = JSON.parse(content);
      return GenerateFlashcardsFromTextOutputSchema.parse(parsed);
    } catch (e) {
      console.error('Failed to parse OpenAI response as JSON:', content);
      throw new Error('Failed to parse LLM response as JSON');
    }
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    throw new Error('Failed to generate flashcards.');
  }
}
