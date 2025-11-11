'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating a quiz from a summary.
 *
 * It takes a summary content and generates a quiz with questions, options, and explanations.
 *
 * @example
 * // Example usage:
 * // const result = await generateQuizFromSummary({ summaryContent: \'summary text here\', options: { questionCount: 5 } });
 */

import {ai} from '@/ai/genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {z} from 'genkit';

const GenerateQuizFromSummaryInputSchema = z.object({
  summaryContent: z.string().describe('The content of the summary to generate a quiz from.'),
  options: z
    .object({
      questionCount: z.number().describe('The number of questions to generate for the quiz.'),
      difficulty: z.string().optional().describe('The difficulty level of the quiz questions.'),
    })
    .optional(),
});
export type GenerateQuizFromSummaryInput = z.infer<typeof GenerateQuizFromSummaryInputSchema>;

const QuizQuestionSchema = z.object({
  question: z.string().describe('The quiz question.'),
  options: z.array(z.string()).describe('The possible answers to the question.'),
  correctIndex: z.number().describe('The index of the correct answer in the options array.'),
  explanation: z.string().describe('The explanation for why the answer is correct.'),
});

const GenerateQuizFromSummaryOutputSchema = z.object({
  questions: z.array(QuizQuestionSchema).describe('The generated quiz questions.'),
});
export type GenerateQuizFromSummaryOutput = z.infer<typeof GenerateQuizFromSummaryOutputSchema>;

/**
 * Generates a quiz from a given summary content.
 * @param input - The input containing the summary content and options for quiz generation.
 * @returns A promise that resolves to the generated quiz.
 */
export async function generateQuizFromSummary(input: GenerateQuizFromSummaryInput): Promise<GenerateQuizFromSummaryOutput> {
  return generateQuizFromSummaryFlow(input);
}

const generateQuizPrompt = ai.definePrompt({
  name: 'generateQuizFromSummaryPrompt',
  input: {schema: GenerateQuizFromSummaryInputSchema},
  output: {schema: GenerateQuizFromSummaryOutputSchema},
  model: googleAI.model('gemini-1.5-flash-latest'),
  prompt: `You are a quiz generator. Generate a quiz based on the following summary.

Summary: {{{summaryContent}}}

Options: {{{options}}}

Each question should have 4 options and a correct answer index.

Ensure the questions and answers are accurate and relevant to the summary.

Output a JSON object containing an array of question objects.
`, // Removed example from the prompt
});

const generateQuizFromSummaryFlow = ai.defineFlow(
  {
    name: 'generateQuizFromSummaryFlow',
    inputSchema: GenerateQuizFromSummaryInputSchema,
    outputSchema: GenerateQuizFromSummaryOutputSchema,
  },
  async input => {
    const {output} = await generateQuizPrompt(input);
    return output!;
  }
);
