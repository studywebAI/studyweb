/**
 * @fileOverview This file defines a function for grading a user's answer to a quiz question using an AI model.
 */

'use server';

import {z} from 'zod';
import {
  GradeAnswerInputSchema,
  GradeAnswerOutputSchema,
} from './schemas';
import { callGenerativeAI } from '../unified-ai-handler';

export type GradeAnswerInput = z.infer<
  typeof GradeAnswerInputSchema
>;
export type GradeAnswerOutput = z.infer<
  typeof GradeAnswerOutputSchema
>;

/**
 * Grades a user's answer to a quiz question.
 * @param input - The input containing the question, correct answer, and user's answer.
 * @returns A promise that resolves to the grade and an explanation.
 */
export async function gradeAnswer(
  input: GradeAnswerInput
): Promise<GradeAnswerOutput> {
  try {
    const systemPrompt = `You are an AI assistant that grades quiz answers.
    Evaluate the user's answer based on the provided question and the ideal correct answer.

    Your response must be a JSON object with two keys:
    1. "grade": A string which must be one of 'correct', 'incorrect', or 'partially_correct'.
       - Use 'correct' if the user's answer is essentially the same as the correct answer, allowing for very minor phrasing differences.
       - Use 'incorrect' if the user's answer is wrong.
       - Use 'partially_correct' if the user's answer is on the right track but is missing key information or has a minor error.
    2. "explanation": A concise explanation for the grade. If the answer is incorrect or partially correct, explain what's wrong or missing.

    Be strict but fair. Minor spelling errors should not necessarily make an answer incorrect if the meaning is clear.
    `;
    const userPrompt = `
        Question: "${input.question}"
        Ideal Correct Answer: "${input.correctAnswer}"
        User's Answer: "${input.userAnswer}"

        Please grade the user's answer.
    `;

    const result = await callGenerativeAI({
        model: input.model,
        apiKey: input.apiKey,
        systemPrompt: systemPrompt,
        userPrompt: userPrompt,
        schema: GradeAnswerOutputSchema,
    });
    
    return result;

  } catch (error: any) {
    console.error('Error grading answer:', error);
    throw error;
  }
}
