'use server';
/**
 * @fileOverview This file defines a function for generating concise summaries from text using the OpenAI API.
 */

import {z} from 'genkit';

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
  const prompt = `You are an expert in summarizing text. Generate a concise summary of the following text.
  
  Text: ${input.text}
  `;

  const systemPrompt = `You must respond with a valid JSON object matching the following schema:
  ${JSON.stringify(GenerateSummaryFromTextOutputSchema.parse({summary: ''}))}
  `;

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
          messages: [
            {role: 'system', content: systemPrompt},
            {role: 'user', content: prompt}
          ],
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
      return GenerateSummaryFromTextOutputSchema.parse(parsed);
    } catch (e) {
      console.error('Failed to parse OpenAI response as JSON:', content);
      throw new Error('Failed to parse LLM response as JSON');
    }
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    throw new Error('Failed to generate summary.');
  }
}
