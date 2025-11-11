'use server';
/**
 * @fileOverview This file defines a function for generating a quiz from a summary using the OpenAI API.
 */

import {z} from 'genkit';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const GenerateQuizFromSummaryInputSchema = z.object({
  summaryContent: z
    .string()
    .describe('The content of the summary to generate a quiz from.'),
  options: z
    .object({
      questionCount: z
        .number()
        .describe('The number of questions to generate for the quiz.'),
      difficulty: z
        .string()
        .optional()
        .describe('The difficulty level of the quiz questions.'),
    })
    .optional(),
});
export type GenerateQuizFromSummaryInput = z.infer<
  typeof GenerateQuizFromSummaryInputSchema
>;

const QuizQuestionSchema = z.object({
  question: z.string().describe('The quiz question.'),
  options: z.array(z.string()).describe('The possible answers to the question.'),
  correctIndex: z
    .number()
    .describe('The index of the correct answer in the options array.'),
  explanation: z
    .string()
    .describe('The explanation for why the answer is correct.'),
});

const GenerateQuizFromSummaryOutputSchema = z.object({
  questions: z
    .array(QuizQuestionSchema)
    .describe('The generated quiz questions.'),
});
export type GenerateQuizFromSummaryOutput = z.infer<
  typeof GenerateQuizFromSummaryOutputSchema
>;

/**
 * Generates a quiz from a given summary content.
 * @param input - The input containing the summary content and options for quiz generation.
 * @returns A promise that resolves to the generated quiz.
 */
export async function generateQuizFromSummary(
  input: GenerateQuizFromSummaryInput
): Promise<GenerateQuizFromSummaryOutput> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('Missing OPENAI_API_KEY in environment');
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a quiz generator. You must respond with a valid JSON object matching the following schema:
            {
              "questions": [
                {
                  "question": "The question text.",
                  "options": ["Option A", "Option B", "Option C", "Option D"],
                  "correctIndex": 0,
                  "explanation": "Explanation of why the answer is correct."
                }
              ]
            }`,
        },
        {
          role: 'user',
          content: `Generate a quiz based on the following summary.\n\nSummary: ${
            input.summaryContent
          }\n\nOptions: ${JSON.stringify(input.options)}`,
        },
      ],
      response_format: {type: 'json_object'},
    });

    const content = response.choices[0].message?.content;
    if (!content) {
      throw new Error('No content returned from OpenAI.');
    }

    const parsed = JSON.parse(content);
    return GenerateQuizFromSummaryOutputSchema.parse(parsed);
  } catch (error: any) {
    console.error("REAL OPENAI ERROR:", JSON.stringify(error, null, 2));
    throw error;
  }
}