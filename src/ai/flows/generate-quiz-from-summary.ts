'use server';
/**
 * @fileOverview This file defines a function for generating a quiz from a summary using the OpenAI API.
 */

import {z} from 'genkit';

const GenerateQuizFromSummaryInputSchema = z.object({
  summaryContent: z.string().describe('The content of the summary to generate a quiz from.'),
  options: z
    .object({
      questionCount: z.number().describe('The number of questions to generate for the quiz.'),
      difficulty: z.string().optional().describe('The difficulty level of the quiz questions.'),
    })
    .optional(),
});
export type GenerateQuizFromSummaryInput = z.infer<typeof GenerateQuizFromSummaryInputSchema>;

const QuizQuestionSchema = z.object({
  question: z.string().describe('The quiz question.'),
  options: z.array(z.string()).describe('The possible answers to the question.'),
  correctIndex: z.number().describe('The index of the correct answer in the options array.'),
  explanation: z.string().describe('The explanation for why the answer is correct.'),
});

const GenerateQuizFromSummaryOutputSchema = z.object({
  questions: z.array(QuizQuestionSchema).describe('The generated quiz questions.'),
});
export type GenerateQuizFromSummaryOutput = z.infer<typeof GenerateQuizFromSummaryOutputSchema>;

/**
 * Generates a quiz from a given summary content.
 * @param input - The input containing the summary content and options for quiz generation.
 * @returns A promise that resolves to the generated quiz.
 */
export async function generateQuizFromSummary(input: GenerateQuizFromSummaryInput): Promise<GenerateQuizFromSummaryOutput> {
  const userPrompt = `You are a quiz generator. Generate a quiz based on the following summary.

  Summary: ${input.summaryContent}

  Options: ${JSON.stringify(input.options)}

  Each question should have 4 options and a correct answer index.

  Ensure the questions and answers are accurate and relevant to the summary.
`;

  const systemPrompt = `You must respond with a valid JSON object matching the following schema:
{
  "questions": [
    {
      "question": "The question text.",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Explanation of why the answer is correct."
    }
  ]
}
`;

  const messages = [
    {role: 'system', content: systemPrompt},
    {role: 'user', content: userPrompt}
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
      return GenerateQuizFromSummaryOutputSchema.parse(parsed);
    } catch (e) {
      console.error('Failed to parse OpenAI response as JSON:', content);
      throw new Error('Failed to parse LLM response as JSON');
    }
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    throw new Error('Failed to generate quiz.');
  }
}
