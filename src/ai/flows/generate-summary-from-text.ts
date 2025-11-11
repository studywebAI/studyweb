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
  summary: z.string().describe('The generated summary.'),
});
export type GenerateSummaryFromTextOutput = z.infer<
  typeof GenerateSummaryFromTextOutputSchema
>;

export async function generateSummaryFromText(
  input: GenerateSummaryFromTextInput
): Promise<GenerateSummaryFromTextOutput> {
  const result = await generateSummaryFromTextFlow(input);
  return result;
}

const prompt = ai.definePrompt({
  name: 'generateSummaryFromTextPrompt',
  input: {schema: GenerateSummaryFromTextInputSchema},
  model: googleAI.model('models/gemini-1.5-flash-latest'),
  prompt: `You are an expert in summarizing text. Generate a concise summary of the following text.
  
  Respond with a valid JSON object matching the following schema:
  ${JSON.stringify(GenerateSummaryFromTextOutputSchema.parse({summary: ''}))}

  Text: {{{text}}}
  `,
});

const generateSummaryFromTextFlow = ai.defineFlow(
  {
    name: 'generateSummaryFromTextFlow',
    inputSchema: GenerateSummaryFromTextInputSchema,
    outputSchema: GenerateSummaryFromTextOutputSchema,
  },
  async input => {
    const response = await prompt(input);
    const text = response.text;
    try {
      return JSON.parse(text);
    } catch (e) {
      const jsonText = text.match(/```json\n([\s\S]*)\n```/);
      if (jsonText && jsonText[1]) {
        return JSON.parse(jsonText[1]);
      }
      throw new Error('Failed to parse LLM response as JSON');
    }
  }
);
