'use server';

import { z } from 'zod';
import { type AIModel, getModel, callWithRetry } from './models';

interface CallGenerativeAIOptions<T extends z.ZodType<any, any, any>> {
  model: AIModel;
  apiKey?: {
    provider: 'google' | 'openai';
    key: string;
  } | null;
  systemPrompt: string;
  userPrompt: string;
  schema: T;
}

/**
 * A unified handler to generate content from either Google or OpenAI models.
 * This function is designed to be called from server-side actions.
 * It automatically handles API key rotation and retries.
 * 
 * @param options - The options for generating content.
 * @returns The generated content, parsed by the provided Zod schema.
 */
export async function callGenerativeAI<T extends z.ZodType<any, any, any>>(
  options: CallGenerativeAIOptions<T>
): Promise<z.infer<T>> {
  const { model, apiKey, systemPrompt, userPrompt, schema } = options;
  const { provider, modelName } = getModel(model);

  // Prepare a list of keys to try, starting with the user-provided key (if any).
  const keysToTry: string[] = [];

  // 1. Add user-provided key if it's valid and not a placeholder
  if (apiKey?.key && !apiKey.key.includes('YOUR_') && apiKey.key.length > 10) {
      keysToTry.push(apiKey.key);
  }
  
  // 2. Add server-side environment keys as fallbacks
  if (provider === 'openai') {
    if (process.env.OPENAI_API_KEY) keysToTry.push(process.env.OPENAI_API_KEY);
    if (process.env.OPENAI_API_KEY_1) keysToTry.push(process.env.OPENAI_API_KEY_1);
  } else { // 'google'
    if (process.env.GEMINI_API_KEY) keysToTry.push(process.env.GEMINI_API_KEY);
    if (process.env.GEMINI_API_KEY_1) keysToTry.push(process.env.GEMINI_API_KEY_1);
  }

  // Remove duplicates that might occur if user key is same as env key
  const uniqueKeys = [...new Set(keysToTry)];

  if (uniqueKeys.length === 0) {
    throw new Error(`No valid API keys were available for ${provider}. Please add one in the app settings or in the server .env file.`);
  }

  console.log(`Attempting to call ${provider} with up to ${uniqueKeys.length} available keys.`);
  return await callWithRetry(provider, uniqueKeys, modelName, systemPrompt, userPrompt, schema);
}
