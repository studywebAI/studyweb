'use server';
/**
 * @fileOverview This file defines a Genkit flow that imports content from various sources and generates a quiz.
 *
 * - importContentForQuizGeneration - A function that handles the content import and quiz generation process.
 * - ImportContentForQuizGenerationInput - The input type for the importContentForQuizGeneration function.
 * - ImportContentForQuizGenerationOutput - The return type for the importContentForQuizGeneration function.
 */

import {ai} from '@/ai/genkit';
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
  output: {schema: ImportContentForQuizGenerationOutputSchema},
  prompt: `Generate a quiz from the following content. The quiz should have {{{options.question_count}}} questions and the difficulty should be {{{options.difficulty}}}.\n\nContent: {{{content}}}`,
});

const importContentForQuizGenerationFlow = ai.defineFlow(
  {
    name: 'importContentForQuizGenerationFlow',
    inputSchema: ImportContentForQuizGenerationInputSchema,
    outputSchema: ImportContentForQuizGenerationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
