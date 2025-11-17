'use server';
/**
 * @fileOverview A Genkit flow for generating a set of quiz questions.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import { QuestionType } from '@/types/database';

const QuestionTypeEnum = z.enum(['multiple_choice', 'open_answer', 'true_false']);

export const GenerateQuestionsInputSchema = z.object({
  topic: z.string().describe('The topic to generate questions about.'),
  questionCount: z.number().min(1).max(50).describe('The number of questions to generate.'),
});
export type GenerateQuestionsInput = z.infer<typeof GenerateQuestionsInputSchema>;


const GeneratedQuestionSchema = z.object({
    question_text: z.string().describe("The text of the question."),
    type: QuestionTypeEnum.describe("The type of question."),
    difficulty: z.number().min(0).max(10).describe("A difficulty score from 0 (easy) to 10 (very hard)."),
    answers: z.any().optional().describe("A JSON object for multiple choice answers, e.g., {'a': 'Paris', 'b': 'London'}."),
    correct_answer: z.any().describe("The correct answer. For multiple choice, this is the key (e.g., 'a'). For true/false, a boolean. For open answer, the ideal string."),
    explanation: z.string().optional().describe("A brief explanation of the correct answer.")
});

export const GenerateQuestionsOutputSchema = z.object({
  questions: z.array(GeneratedQuestionSchema),
});
export type GenerateQuestionsOutput = z.infer<typeof GenerateQuestionsOutputSchema>;


const generationPrompt = `
    You are an expert curriculum developer and quiz creator.
    Your task is to generate a set of {{questionCount}} high-quality quiz questions about the topic: "{{topic}}".

    Please provide a mix of the following question types:
    - multiple_choice: A question with several options, one of which is correct.
    - true_false: A statement that is either true or false.
    - open_answer: A question that requires a short, text-based answer.

    For each question, you must provide:
    1.  'question_text': The question itself.
    2.  'type': One of 'multiple_choice', 'true_false', or 'open_answer'.
    3.  'difficulty': An integer from 0 (very easy) to 10 (expert level).
    4.  'answers': For 'multiple_choice' questions, provide a JSON object with at least 3 options (e.g., {"a": "Option A", "b": "Option B", "c": "Option C"}). For other types, this can be null.
    5.  'correct_answer': The correct answer. For 'multiple_choice', provide the key of the correct option (e.g., "a"). For 'true_false', provide a boolean (true/false). For 'open_answer', provide the ideal string answer.
    6.  'explanation': A concise reason why the correct answer is correct.

    Generate a diverse set of questions that cover the topic from different angles. Ensure the difficulty levels are varied.
`;

export async function generateQuestions(input: GenerateQuestionsInput): Promise<GenerateQuestionsOutput> {
  return generateQuestionsFlow(input);
}


const generateQuestionsFlow = ai.defineFlow(
  {
    name: 'generateQuestionsFlow',
    inputSchema: GenerateQuestionsInputSchema,
    outputSchema: GenerateQuestionsOutputSchema,
  },
  async (input) => {
    
    const llmResponse = await ai.generate({
      model: 'google/gemini-1.5-pro-latest',
      prompt: generationPrompt,
      input: {
          topic: input.topic,
          questionCount: input.questionCount,
      },
      output: {
          schema: GenerateQuestionsOutputSchema
      },
      config: {
          temperature: 0.8 // Higher temperature for more creative/varied questions
      }
    });

    const output = llmResponse.output;

    if (!output) {
      throw new Error("AI failed to generate questions in the expected format.");
    }

    return output;
  }
);
