import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';

// List of all available AI models
export const AI_MODELS = {
  // OpenAI
  'gpt-4o': { provider: 'openai', modelName: 'gpt-4o' },
  'gpt-4o-mini': { provider: 'openai', modelName: 'gpt-4o-mini' },
  'gpt-4-turbo': { provider: 'openai', modelName: 'gpt-4-turbo' },
  'gpt-4': { provider: 'openai', modelName: 'gpt-4' },
  // Google
  'gemini-1.5-pro-latest': { provider: 'google', modelName: 'gemini-1.5-pro-latest' },
  'gemini-1.5-flash-latest': { provider: 'google', modelName: 'gemini-1.5-flash-latest' },
} as const;

export type AIModel = keyof typeof AI_MODELS;

/**
 * Returns the provider and model name for a given AI model alias.
 * @param model - The AI model alias.
 * @returns An object containing the provider and model name.
 */
export function getModel(model: AIModel) {
  return AI_MODELS[model] || AI_MODELS['gemini-1.5-flash-latest'];
}

/**
 * Calls the OpenAI API with a given set of parameters.
 */
async function callOpenAI<T extends z.ZodType<any, any, any>>(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  schema: T
): Promise<z.infer<T>> {
  const openai = new OpenAI({ apiKey });
  const response = await openai.chat.completions.create({
    model: model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error('OpenAI returned an empty response.');
  }
  
  try {
    const parsedJson = JSON.parse(content);
    return schema.parse(parsedJson);
  } catch (error) {
    console.error("Failed to parse OpenAI response:", content);
    throw new Error("The AI returned a response that was not valid JSON.");
  }
}

/**
 * Calls the Google Generative AI API with a given set of parameters.
 */
async function callGoogle<T extends z.ZodType<any, any, any>>(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  schema: T
): Promise<z.infer<T>> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const generativeModel = genAI.getGenerativeModel({
    model: model,
    systemInstruction: systemPrompt,
    generationConfig: {
        responseMimeType: 'application/json',
    }
  });

  const result = await generativeModel.generateContent(userPrompt);
  const response = await result.response;
  const text = response.text();

  try {
    const parsedJson = JSON.parse(text);
    return schema.parse(parsedJson);
  } catch (error) {
    console.error("Failed to parse Google response:", text);
    throw new Error("The AI returned a response that was not valid JSON.");
  }
}


/**
 * Calls the specified AI provider with a list of API keys, retrying on failure.
 * @param provider - The AI provider ('openai' or 'google').
 * @param keys - An array of API keys to try.
 * @param model - The model name to use.
 * @param systemPrompt - The system prompt.
 * @param userPrompt - The user prompt.
 * @param schema - The Zod schema for the expected response.
 * @returns The generated content parsed according to the schema.
 */
export async function callWithRetry<T extends z.ZodType<any, any, any>>(
  provider: 'openai' | 'google',
  keys: string[],
  model: string,
  systemPrompt: string,
  userPrompt: string,
  schema: T
): Promise<z.infer<T>> {
  let lastError: Error | null = null;

  for (const key of keys) {
    try {
      if (provider === 'openai') {
        return await callOpenAI(key, model, systemPrompt, userPrompt, schema);
      } else {
        return await callGoogle(key, model, systemPrompt, userPrompt, schema);
      }
    } catch (error: any) {
      lastError = error;
      // Check for specific auth/quota errors to decide if we should retry
      if (error instanceof OpenAI.APIError && (error.status === 401 || error.status === 429)) {
        console.warn(`API key failed for ${provider}. Retrying with next key.`);
        continue;
      }
      // Add equivalent check for Google's client library if needed
      // For now, we'll retry on any error for Google
      if (provider === 'google') {
          console.warn(`API call failed for ${provider}. Retrying with next key. Error: ${error.message}`);
          continue;
      }
      // If it's not a retriable error, break the loop
      break;
    }
  }
  
  throw lastError || new Error(`All API calls failed for ${provider}.`);
}
