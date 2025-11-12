/**
 * @fileOverview This file defines a function for generating concise summaries from text using an AI model.
 */

import {z} from 'zod';
import OpenAI from 'openai';
import {GenerateSummaryFromTextInputSchema, GenerateSummaryFromTextOutputSchema} from './schemas';


export type GenerateSummaryFromTextInput = z.infer<
  typeof GenerateSummaryFromTextInputSchema
>;

export type GenerateSummaryFromTextOutput = z.infer<
  typeof GenerateSummaryFromTextOutputSchema
>;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


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
          content: `You are an expert in summarizing text. Generate a concise summary of the provided text. Respond in JSON format. The response should be a JSON object with a single key "summary".`,
        },
        { role: 'user', content: `Text: ${input.text}` },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0].message?.content;
    if (!content) {
      throw new Error('No content returned from OpenAI API.');
    }
    
    const parsed = JSON.parse(content);
    // Validate with Zod, but return the parsed object directly
    GenerateSummaryFromTextOutputSchema.parse(parsed);
    return parsed;

  } catch (error: any) {
    console.error("Error generating summary:", error);
    throw error;
  }
}
