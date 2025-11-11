'use server';
/**
 * @fileOverview This file defines a function for generating answers from text using an AI model.
 *
 * - generateAnswerFromText - A function that takes text and history as input and returns an answer.
 * - GenerateAnswerFromTextInput - The input type for the generateAnswerFromText function.
 * - GenerateAnswerFromTextOutput - The return type for the generateAnswerFromtext function.
 */

import {z} from 'genkit';
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

    const messages: any[] = [
      {
        role: 'system',
        content: `You are a helpful AI assistant. Answer the user's question based on the provided conversation history. Respond in JSON format using the following schema: ${JSON.stringify(GenerateAnswerFromTextOutputSchema)}`,
      },
    ];

    if (input.history) {
      input.history.forEach(h => {
        messages.push({ role: h.role, content: h.content });
      });
    }

    messages.push({ role: 'user', content: `Question: ${input.text}` });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: messages,
      temperature: 0.5,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0].message?.content;
    if (!content) {
      throw new Error('No content returned from OpenAI API.');
    }

    const parsed = GenerateAnswerFromTextOutputSchema.parse(JSON.parse(content));
    return parsed;
  } catch (error: any) {
    console.error("REAL OPENAI ERROR:", JSON.stringify(error, null, 2));
    throw new Error('Failed to generate answer.');
  }
}