'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating answers from text.
 *
 * - generateAnswerFromText - A function that takes text as input and returns a summarized version.
 * - GenerateAnswerFromTextInput - The input type for the generateAnswerFromText function.
 * - GenerateAnswerFromTextOutput - The return type for the generateAnswerFromText function.
 */

import {ai} from '@/ai/genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {z} from 'genkit';

const GenerateAnswerFromTextInputSchema = z.object({
  text: z.string().describe('The question to answer.'),
  history: z.array(z.object({
    role: z.enum(['user', 'ai']),
    content: z.string(),
  })).optional().describe('The conversation history.'),
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
  return generateAnswerFromTextFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateAnswerFromTextPrompt',
  input: {schema: GenerateAnswerFromTextInputSchema},
  output: {schema: GenerateAnswerFromTextOutputSchema},
  model: googleAI.model('gemini-1.5-flash'),
  prompt: `You are a helpful AI assistant. Answer the user's question based on the conversation history.

  {{#if history}}
  History:
  {{#each history}}
  {{role}}: {{content}}
  {{/each}}
  {{/if}}

  Question: {{text}}
  Answer:
  `,
});

const generateAnswerFromTextFlow = ai.defineFlow(
  {
    name: 'generateAnswerFromTextFlow',
    inputSchema: GenerateAnswerFromTextInputSchema,
    outputSchema: GenerateAnswerFromTextOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
