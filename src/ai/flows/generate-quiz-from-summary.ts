/**
 * @fileOverview This file defines a function for generating a quiz from a summary using an AI model.
 */

import {z} from 'zod';
import OpenAI from 'openai';
import { GenerateQuizFromSummaryInputSchema, GenerateQuizFromSummaryOutputSchema } from './schemas';


export type GenerateQuizFromSummaryInput = z.infer<
  typeof GenerateQuizFromSummaryInputSchema
>;
export type GenerateQuizFromSummaryOutput = z.infer<
  typeof GenerateQuizFromSummaryOutputSchema
>;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


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
      model: input.model || 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a quiz generator. Generate a quiz based on the following summary. Respond in JSON format. The response should be a JSON object with a single key "questions", which is an array of question objects. Each question object should have "question", "options" (an array of strings), "correctIndex" (a number), and "explanation" keys.
    
            Options:
            - Number of Questions: ${input.options?.questionCount || 10}
            - Difficulty: ${input.options?.difficulty || 'medium'}
          `,
        },
        { role: 'user', content: `Summary: ${input.summaryContent}` },
      ],
      temperature: 0.4,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0].message?.content;
    if (!content) {
      throw new Error('No content returned from OpenAI API.');
    }

    const parsed = JSON.parse(content);
    return parsed;

  } catch (error: any) {
    console.error("Error generating quiz:", error);
    throw error;
  }
}
