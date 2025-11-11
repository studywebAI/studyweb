'use server';
/**
 * @fileOverview This file defines a function for generating answers from text using the OpenAI API.
 *
 * - generateAnswerFromText - A function that takes text and history as input and returns an answer.
 * - GenerateAnswerFromTextInput - The input type for the generateAnswerFromText function.
 * - GenerateAnswerFromTextOutput - The return type for the generateAnswerFromtext function.
 */

import {z} from 'genkit';

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
  const prompt = `You are a helpful AI assistant. Answer the user's question based on the conversation history.

  ${
    input.history
      ? 'History:\n' +
        input.history
          .map(h => `${h.role === 'ai' ? 'AI' : 'User'}: ${h.content}`)
          .join('\n')
      : ''
  }

  Question: ${input.text}
  `;

  const systemPrompt = `You must respond with a valid JSON object matching the following schema:
  {
    "answer": "The generated answer to the question."
  }
  `;

  const messages = [
    {
      role: 'system',
      content: systemPrompt,
    },
    {
      role: 'user',
      content: prompt,
    },
  ];

  try {
    const response = await fetch(
      'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: messages,
          response_format: {type: 'json_object'},
        }),
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `OpenAI API request failed with status ${response.status}: ${errorBody}`
      );
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    try {
      const parsed = JSON.parse(content);
      return GenerateAnswerFromTextOutputSchema.parse(parsed);
    } catch (e) {
      console.error('Failed to parse OpenAI response as JSON:', content);
      throw new Error('Failed to parse LLM response as JSON');
    }
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    throw new Error('Failed to generate answer.');
  }
}
