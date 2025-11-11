'use server';
/**
 * @fileOverview This file defines a Genkit flow that imports content from various sources and generates a quiz.
 *
 * - importContentForQuizGeneration - A function that handles the content import and quiz generation process.
 * - ImportContentForQuizGenerationInput - The input type for the importContentForQuizGeneration function.
 * - ImportContentForQuizGenerationOutput - The return type for the importContentForQuizGeneration function.
 */

import {ai} from '@/ai/genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {z} from 'genkit';

const ImportContentForQuizGenerationInputSchema = z.object({
  content: z.string().describe('The content to be used for quiz generation.'),
  options: z
    .object({
      question_count: z.number().describe('The number of questions to generate.'),
      difficulty: z.string().describe('The difficulty level of the quiz.'),
    })
    .optional(),
});
export type ImportContentForQuizGenerationInput = z.infer<
  typeof ImportContentForQuizGenerationInputSchema
>;

const ImportContentForQuizGenerationOutputSchema = z.object({
  questions: z.array(
    z.object({
      question: z.string().describe('The quiz question.'),
      options: z.array(z.string()).describe('The possible answers.'),
      correctIndex: z.number().describe('The index of the correct answer.'),
      explanation: z.string().describe('Explanation of the correct answer.'),
    })
  ),
});
export type ImportContentForQuizGenerationOutput = z.infer<
  typeof ImportContentForQuizGenerationOutputSchema
>;

export async function importContentForQuizGeneration(
  input: ImportContentForQuizGenerationInput
): Promise<ImportContentForQuizGenerationOutput> {
  return importContentForQuizGenerationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'importContentForQuizGenerationPrompt',
  input: {schema: ImportContentForQuizGenerationInputSchema},
  model: googleAI.model('gemini-1.5-pro-latest'),
  prompt: `Generate a quiz from the following content.

  Respond with a valid JSON object matching the following schema:
  ${JSON.stringify(
    ImportContentForQuizGenerationOutputSchema.parse({
      questions: [
        {
          question: '',
          options: [],
          correctIndex: 0,
          explanation: '',
        },
      ],
    })
  )}
  
  The quiz should have {{{options.question_count}}} questions and the difficulty should be {{{options.difficulty}}}.
  
  Content: {{{content}}}`,
});

const importContentForQuizGenerationFlow = ai.defineFlow(
  {
    name: 'importContentForQuizGenerationFlow',
    inputSchema: ImportContentForQuizGenerationInputSchema,
    outputSchema: ImportContentForQuizGenerationOutputSchema,
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
