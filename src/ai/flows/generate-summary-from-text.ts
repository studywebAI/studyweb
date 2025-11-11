'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating concise summaries from text.
 *
 * - generateSummaryFromText - A function that takes text as input and returns a summarized version.
 * - GenerateSummaryFromTextInput - The input type for the generateSummaryFromText function.
 * - GenerateSummaryFromTextOutput - The return type for the generateSummaryFromText function.
 */

import {ai} from '@/ai/genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {z} from 'genkit';

const GenerateSummaryFromTextInputSchema = z.object({
  text: z.string().describe('The text to summarize.'),
});
export type GenerateSummaryFromTextInput = z.infer<
  typeof GenerateSummaryFromTextInputSchema
>;

const GenerateSummaryFromTextOutputSchema = z.object({
  summary: z.string().describe('The concise summary of the input text.'),
});
export type GenerateSummaryFromTextOutput = z.infer<
  typeof GenerateSummaryFromTextOutputSchema
>;

export async function generateSummaryFromText(
  input: GenerateSummaryFromTextInput
): Promise<GenerateSummaryFromTextOutput> {
  return generateSummaryFromTextFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSummaryFromTextPrompt',
  input: {schema: GenerateSummaryFromTextInputSchema},
  output: {schema: GenerateSummaryFromTextOutputSchema},
  prompt: `Summarize the following text:\n\n{{text}}`,
});

const generateSummaryFromTextFlow = ai.defineFlow(
  {
    name: 'generateSummaryFromTextFlow',
    inputSchema: GenerateSummaryFromTextInputSchema,
    outputSchema: GenerateSummaryFromTextOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
