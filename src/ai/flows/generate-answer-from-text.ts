'use server';
/**
 * @fileOverview This file defines a function for generating answers from text using the OpenAI API.
 *
 * - generateAnswerFromText - A function that takes text and history as input and returns an answer.
 * - GenerateAnswerFromTextInput - The input type for the generateAnswerFromText function.
 * - GenerateAnswerFromTextOutput - The return type for the generateAnswerFromtext function.
 */

import {z} from 'genkit';
import OpenAI from 'openai';
import {ChatCompletionMessageParam} from 'openai/resources/chat';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const GenerateAnswerFromTextInputSchema = z.object({
  text: z.string().describe('The question to answer.'),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'ai']),
        content: z.string(),
      })
    )
    .optional()
    .describe('The conversation history.'),
});
export type GenerateAnswerFromTextInput = z.infer<
  typeof GenerateAnswerFromTextInputSchema
>;

const GenerateAnswerFromTextOutputSchema = z.object({
  answer: z.string().describe('The answer to the question.'),
});
export type GenerateAnswerFromTextOutput = z.infer<
  typeof GenerateAnswerFromTextOutputSchema
>;

export async function generateAnswerFromText(
  input: GenerateAnswerFromTextInput
): Promise<GenerateAnswerFromTextOutput> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('Missing OPENAI_API_KEY in environment');
    }

    const messages: ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content:
          'You are a helpful AI assistant. Answer the user\'s question. You must respond with a valid JSON object matching the following schema: { "answer": "The generated answer to the question." }',
      },
    ];

    if (input.history) {
      input.history.forEach(h => {
        // Translate 'ai' role to 'assistant' for OpenAI API
        messages.push({
          role: h.role === 'ai' ? 'assistant' : 'user',
          content: h.content,
        });
      });
    }

    messages.push({
      role: 'user',
      content: input.text,
    });

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      response_format: {type: 'json_object'},
    });

    const content = response.choices[0].message?.content;
    if (!content) {
      throw new Error('No content returned from OpenAI.');
    }

    const parsed = JSON.parse(content);
    return GenerateAnswerFromTextOutputSchema.parse(parsed);
  } catch (error: any) {
    console.error("REAL OPENAI ERROR:", JSON.stringify(error, null, 2));
    throw error;
  }
}