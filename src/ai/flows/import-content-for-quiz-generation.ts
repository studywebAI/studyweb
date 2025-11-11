'use server';
/**
 * @fileOverview This file defines a function that imports content and generates a quiz using the OpenAI API.
 */

import {z} from 'genkit';

const ImportContentForQuizGenerationInputSchema = z.object({
  content: z.string().describe('The content to be used for quiz generation.'),
  options: z
    .object({
      question_count: z.number().describe('The number of questions to generate.'),
      difficulty: z.string().describe('The difficulty level of the quiz.'),
    })
    .optional(),
});
export type ImportContentForQuizGenerationInput = z.infer<
  typeof ImportContentForQuizGenerationInputSchema
>;

const ImportContentForQuizGenerationOutputSchema = z.object({
  questions: z.array(
    z.object({
      question: z.string().describe('The quiz question.'),
      options: z.array(z.string()).describe('The possible answers.'),
      correctIndex: z.number().describe('The index of the correct answer.'),
      explanation: z.string().describe('Explanation of the correct answer.'),
    })
  ),
});
export type ImportContentForQuizGenerationOutput = z.infer<
  typeof ImportContentForQuizGenerationOutputSchema
>;

export async function importContentForQuizGeneration(
  input: ImportContentForQuizGenerationInput
): Promise<ImportContentForQuizGenerationOutput> {
  const prompt = `Generate a quiz from the following content.

  Respond with a valid JSON object matching the following schema:
  ${JSON.stringify(
    ImportContentForQuizGenerationOutputSchema.parse({
      questions: [
        {
          question: '',
          options: [],
          correctIndex: 0,
          explanation: '',
        },
      ],
    })
  )}
  
  The quiz should have ${input.options?.question_count || 10} questions and the difficulty should be ${input.options?.difficulty || 'medium'}.
  
  Content: ${input.content}`;

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
          messages: [{role: 'user', content: prompt}],
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
      return ImportContentForQuizGenerationOutputSchema.parse(parsed);
    } catch (e) {
      console.error('Failed to parse OpenAI response as JSON:', content);
      throw new Error('Failed to parse LLM response as JSON');
    }
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    throw new Error('Failed to generate quiz.');
  }
}
