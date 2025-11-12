'use server';
/**
 * @fileOverview This file defines a function that imports content and generates a quiz using an AI model.
 */

import {z} from 'zod';
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
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a quiz generator. Generate a quiz from the following content.
    
            The quiz should have ${input.options?.question_count || 10} questions and the difficulty should be ${input.options?.difficulty || 'medium'}.
            
            Respond in JSON format. The response should be a JSON object with a single key "questions", which is an array of question objects.
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

    const parsed = JSON.parse(content);
    // Validate with Zod, but return the parsed object directly
    ImportContentForQuizGenerationOutputSchema.parse(parsed);
    return parsed;

  } catch (error: any) {
    console.error("Error generating quiz:", error);
    throw error;
  }
}
