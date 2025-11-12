/**
 * @fileOverview This file defines a function for generating answers from text using an AI model.
 *
 * - generateAnswerFromText - A function that takes text and history as input and returns an answer.
 * - GenerateAnswerFromTextInput - The input type for the generateAnswerFromText function.
 * - GenerateAnswerFromTextOutput - The return type for the generateAnswerFromtext function.
 */

import {z} from 'zod';
import OpenAI from 'openai';
import {GenerateAnswerFromTextInputSchema, GenerateAnswerFromTextOutputSchema} from './schemas';

export type GenerateAnswerFromTextInput = z.infer<
  typeof GenerateAnswerFromTextInputSchema
>;

export type GenerateAnswerFromTextOutput = z.infer<
  typeof GenerateAnswerFromTextOutputSchema
>;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateAnswerFromText(
  input: GenerateAnswerFromTextInput
): Promise<GenerateAnswerFromTextOutput> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('Missing OPENAI_API_KEY in environment');
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a helpful AI assistant. Answer the user's question based on the provided conversation history. Respond in JSON format with a single key "answer".`,
        },
        { role: 'user', content: `History: ${JSON.stringify(input.history)}\n\nQuestion: ${input.text}` },
      ],
      temperature: 0.5,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0].message?.content;
    if (!content) {
      throw new Error('No content returned from OpenAI API.');
    }

    const parsed = JSON.parse(content);
    // Validate with Zod, but return the parsed object directly
    GenerateAnswerFromTextOutputSchema.parse(parsed);
    return parsed;
  } catch (error: any) {
    console.error("Error generating answer:", error);
    throw new Error('Failed to generate answer.');
  }
}
