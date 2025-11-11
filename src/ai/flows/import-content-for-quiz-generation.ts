'use server';
/**
 * @fileOverview This file defines a function that imports content and generates a quiz using an AI model.
 */

import {z} from 'genkit';
import OpenAI from 'openai';
import {ImportContentForQuizGenerationInputSchema, ImportContentForQuizGenerationOutputSchema} from './schemas';

export type ImportContentForQuizGenerationInput = z.infer<
  typeof ImportContentForQuizGenerationInputSchema
>;

export type ImportContentForQuizGenerationOutput = z.infer<
  typeof ImportContentForQuizGenerationOutputSchema
>;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


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
          content: `You are a quiz generator. Generate a quiz from the following content.
    
            The quiz should have ${input.options?.question_count || 10} questions and the difficulty should be ${input.options?.difficulty || 'medium'}.
            
            Respond in JSON format using the following schema: ${JSON.stringify(ImportContentForQuizGenerationOutputSchema)}
            `,
        },
        { role: 'user', content: `Content: ${input.content}` },
      ],
      temperature: 0.4,
      response_format: { type: 'json_object' },
    });
    
    const content = response.choices[0].message?.content;
    if (!content) {
      throw new Error('No content returned from OpenAI API.');
    }

    const parsed = ImportContentForQuizGenerationOutputSchema.parse(JSON.parse(content));
    return parsed;

  } catch (error: any) {
    console.error("REAL OPENAI ERROR:", JSON.stringify(error, null, 2));
    throw new Error('Failed to generate quiz.');
  }
}