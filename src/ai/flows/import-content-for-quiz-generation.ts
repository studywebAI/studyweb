'use server';
/**
 * @fileOverview This file defines a function that imports content and generates a quiz using the OpenAI API.
 */

import {z} from 'genkit';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
          content: `Generate a quiz from the following content.\n\nThe quiz should have ${
            input.options?.question_count || 10
          } questions and the difficulty should be ${
            input.options?.difficulty || 'medium'
          }.\n\nContent: ${input.content}`,
        },
      ],
      response_format: {type: 'json_object'},
    });

    const content = response.choices[0].message?.content;
    if (!content) {
      throw new Error('No content returned from OpenAI.');
    }

    const parsed = JSON.parse(content);
    return ImportContentForQuizGenerationOutputSchema.parse(parsed);
  } catch (error: any) {
    console.error("REAL OPENAI ERROR:", JSON.stringify(error, null, 2));
    throw error;
  }
}