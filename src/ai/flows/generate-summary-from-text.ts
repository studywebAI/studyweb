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
  // Genkit's output for raw text prompts is a string, so we need to parse it.
  if (typeof result === 'string') {
    return JSON.parse(result);
  }
  return result;
}

const prompt = ai.definePrompt({
  name: 'generateSummaryFromTextPrompt',
  input: {schema: GenerateSummaryFromTextInputSchema},
  model: googleAI.model('gemini-1.5-flash'),
  prompt: `You are an expert in summarizing text. Generate a concise summary of the following text.
  
  Text: {{{text}}}
  
  IMPORTANT: Respond ONLY with a valid JSON object that conforms to the following Zod schema. Do not include any other text or markdown formatting.
  \`\`\`json
  ${JSON.stringify(GenerateSummaryFromTextOutputSchema.jsonSchema)}
  \`\`\`
  `,
});

const generateSummaryFromTextFlow = ai.defineFlow(
  {
    name: 'generateSummaryFromTextFlow',
    inputSchema: GenerateSummaryFromTextInputSchema,
    outputSchema: GenerateSummaryFromTextOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    // The output from a raw text prompt will be a string, so we parse it.
    if (typeof output === 'string') {
      try {
        return JSON.parse(output);
      } catch (e) {
        console.error("Failed to parse JSON output:", output);
        throw new Error("Invalid JSON response from AI");
      }
    }
    return output!;
  }
);