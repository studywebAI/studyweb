'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating answers from text.
 *
 * - generateAnswerFromText - A function that takes text as input and returns a summarized version.
 * - GenerateAnswerFromTextInput - The input type for the generateAnswerFromText function.
 * - GenerateAnswerFromTextOutput - The return type for the generateAnswerFromtext function.
 */

import {ai} from '@/ai/genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {z} from 'genkit';

const GenerateAnswerFromTextInputSchema = z.object({
  text: z.string().describe('The question to answer.'),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'ai']),
        content: z.string(),
      })
    )
    .optional()
    .describe('The conversation history.'),
});
export type GenerateAnswerFromTextInput = z.infer<
  typeof GenerateAnswerFromTextInputSchema
>;

const GenerateAnswerFromTextOutputSchema = z.object({
  answer: z.string().describe('The answer to the question.'),
});
export type GenerateAnswerFromTextOutput = z.infer<
  typeof GenerateAnswerFromTextOutputSchema
>;

export async function generateAnswerFromText(
  input: GenerateAnswerFromTextInput
): Promise<GenerateAnswerFromTextOutput> {
  const result = await generateAnswerFromTextFlow(input);
  return result;
}

const prompt = ai.definePrompt({
  name: 'generateAnswerFromTextPrompt',
  input: {schema: GenerateAnswerFromTextInputSchema},
  model: googleAI.model('models/gemini-1.5-flash-latest'),
  prompt: `You are a helpful AI assistant. Answer the user's question based on the conversation history.

  Respond with a valid JSON object matching the following schema:
  ${JSON.stringify(GenerateAnswerFromTextOutputSchema.parse({answer: ''}))}

  {{#if history}}
  History:
  {{#each history}}
  {{role}}: {{content}}
  {{/each}}
  {{/if}}

  Question: {{text}}
  `,
});

const generateAnswerFromTextFlow = ai.defineFlow(
  {
    name: 'generateAnswerFromTextFlow',
    inputSchema: GenerateAnswerFromTextInputSchema,
    outputSchema: GenerateAnswerFromTextOutputSchema,
  },
  async input => {
    const response = await prompt(input);
    const text = response.text;
    try {
      return JSON.parse(text);
    } catch (e) {
      // The model may not have returned valid JSON, so we'll try to extract it.
      const jsonText = text.match(/```json\n([\s\S]*)\n```/);
      if (jsonText && jsonText[1]) {
        return JSON.parse(jsonText[1]);
      }
      throw new Error('Failed to parse LLM response as JSON');
    }
  }
);
