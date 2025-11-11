'use server';
/**
 * @fileOverview This file defines a function for generating concise summaries from text using the OpenAI API.
 */

import {z} from 'genkit';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const GenerateSummaryFromTextInputSchema = z.object({
  text: z.string().describe('The text to summarize.'),
});
export type GenerateSummaryFromTextInput = z.infer<
  typeof GenerateSummaryFromTextInputSchema
>;

const GenerateSummaryFromTextOutputSchema = z.object({
  summary: z.string().describe('The generated summary.'),
});
export type GenerateSummaryFromTextOutput = z.infer<
  typeof GenerateSummaryFromTextOutputSchema
>;

export async function generateSummaryFromText(
  input: GenerateSummaryFromTextInput
): Promise<GenerateSummaryFromTextOutput> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('Missing OPENAI_API_KEY in environment');
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert in summarizing text. You must respond with a valid JSON object matching the following schema: { "summary": "The generated summary." }`,
        },
        {
          role: 'user',
          content: `Generate a concise summary of the following text.\n\nText: ${input.text}`,
        },
      ],
      response_format: {type: 'json_object'},
    });

    const content = response.choices[0].message?.content;
    if (!content) {
      throw new Error('No content returned from OpenAI.');
    }

    const parsed = JSON.parse(content);
    return GenerateSummaryFromTextOutputSchema.parse(parsed);
  } catch (error: any) {
    console.error("REAL OPENAI ERROR:", JSON.stringify(error, null, 2));
    throw error;
  }
}