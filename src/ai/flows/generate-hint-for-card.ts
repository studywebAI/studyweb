'use server';

import { z } from 'zod';
import { callGenerativeAI } from '../unified-ai-handler';

const FlashcardSchema = z.object({
  front: z.string(),
  back: z.string(),
  explanation: z.string().optional(),
});

export const GenerateHintInput = z.object({
  card: FlashcardSchema,
  model: z.string(),
  apiKey: z.object({
      provider: z.enum(['openai', 'google']),
      key: z.string(),
  }),
});

export type GenerateHintInput = z.infer<typeof GenerateHintInput>;

const HintOutputSchema = z.object({
  hint: z.string().describe('A single, short sentence hint to help the user recall the back of the flashcard without giving away the answer.'),
});

export async function generateHintForCard(
  input: GenerateHintInput
): Promise<{ hint: string }> {
  const { card, model, apiKey } = input;

  const systemPrompt = `You are a helpful study assistant. Your goal is to provide a small, subtle hint for a flashcard to help the user remember the answer without giving it away directly. The hint should be a single, short sentence.`;
  
  const userPrompt = `Based on the following flashcard, provide a one-sentence hint to help me remember the answer.\n\nFlashcard Front:\n"${card.front}"\n\nFlashcard Back:\n"${card.back}"\n\nThe hint should not contain the answer from the back of the card. It should be a clever nudge or a related concept to guide my memory. Return the hint in a JSON object with a single key "hint".`;

  const result = await callGenerativeAI({
    model,
    apiKey,
    systemPrompt,
    userPrompt,
    schema: HintOutputSchema,
  });

  return { hint: result.hint };
}
