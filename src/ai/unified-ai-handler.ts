/**
 * @fileOverview This file provides a unified handler for making calls to different generative AI providers.
 * It abstracts the specific SDKs (OpenAI, Google GenAI) into a single function.
 * It also includes a retry mechanism for API key rotation.
 */

import { GoogleGenerativeAI, GoogleGenerativeAIError } from '@google/generative-ai';
import OpenAI from 'openai';
import { z } from 'zod';

// Define a mapping from model prefixes to providers
const MODEL_PROVIDER_MAP: Record<string, 'openai' | 'google'> = {
  'gpt-': 'openai',
  'gemini-': 'google',
};

// Helper function to determine the provider from a model name
function getProviderFromModel(model: string): 'openai' | 'google' {
  for (const prefix in MODEL_PROVIDER_MAP) {
    if (model.startsWith(prefix)) {
      return MODEL_PROVIDER_MAP[prefix];
    }
  }
  // Default to openai if no prefix matches
  return 'openai';
}

interface CallGenerativeAIParams<T extends z.ZodType<any, any>> {
  model: string;
  apiKey?: { provider: 'openai' | 'google', key: string };
  systemPrompt: string;
  userPrompt: string;
  schema: T;
}

// Function to call the underlying AI service. This will be wrapped with retry logic.
async function callAI<T extends z.ZodType<any, any>>(
    provider: 'openai' | 'google',
    apiKey: string,
    model: string,
    systemPrompt: string,
    userPrompt: string,
    schema: T
): Promise<z.infer<T>> {
    if (provider === 'openai') {
        return callOpenAI(apiKey, model, systemPrompt, userPrompt, schema);
    } else if (provider === 'google') {
        return callGoogleAI(apiKey, model, systemPrompt, userPrompt, schema);
    }
    throw new Error(`Unsupported model provider for model: ${model}`);
}


// A wrapper to handle retries with a fallback key.
async function callWithRetry<T extends z.ZodType<any, any>>(
    provider: 'openai' | 'google',
    keys: (string | undefined)[],
    model: string,
    systemPrompt: string,
    userPrompt: string,
    schema: T
): Promise<z.infer<T>> {
    let lastError: any = new Error(`No API keys provided for ${provider}.`);
    
    for (const key of keys) {
        if (!key) continue;
        
        try {
            return await callAI(provider, key, model, systemPrompt, userPrompt, schema);
        } catch (error: any) {
            console.warn(`API call failed with key ending in ...${key.slice(-4)}. Error: ${error.message}`);
            lastError = error;

            // Check if the error is a quota/authentication error to justify a retry
            const isQuotaError = (error instanceof OpenAI.APIError && (error.status === 429 || error.status === 401)) ||
                                 (error instanceof GoogleGenerativeAIError && (error.message.includes('QUOTA') || error.message.includes('API_KEY')));

            if (!isQuotaError) {
                // If it's not a quota error, don't retry with another key as it's likely a different issue.
                throw error;
            }
        }
    }
    // If all keys fail, throw the last encountered error.
    throw lastError;
}


export async function callGenerativeAI<T extends z.ZodType<any, any>>(
  params: CallGenerativeAIParams<T>
): Promise<z.infer<T>> {
  const { model, apiKey, systemPrompt, userPrompt, schema } = params;

  const provider = getProviderFromModel(model);

  // If a user-specific API key is provided in the settings, use it directly without rotation.
  if (apiKey?.key) {
    console.log(`Using user-provided API key for ${provider}.`);
    return callAI(provider, apiKey.key, model, systemPrompt, userPrompt, schema);
  }
  
  // Otherwise, use the server's environment keys with the retry/rotation logic.
  console.log(`Using server-provided API keys for ${provider} with rotation.`);
  const envKeys = provider === 'openai' 
    ? [process.env.OPENAI_API_KEY_1, process.env.OPENAI_API_KEY_2]
    : [process.env.GEMINI_API_KEY_1, process.env.GEMINI_API_KEY_2];

  const availableKeys = envKeys.filter(Boolean);

  if (availableKeys.length === 0) {
      throw new Error(`No server-side API keys configured for ${provider}. Please add them to the .env file.`);
  }

  return callWithRetry(provider, availableKeys, model, systemPrompt, userPrompt, schema);
}


async function callOpenAI<T extends z.ZodType<any, any>>(
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
        temperature: 0.3,
        response_format: { type: 'json_object' },
    });

    const content = response.choices[0].message?.content;
    if (!content) {
        throw new Error('No content returned from OpenAI API.');
    }

    const parsedContent = JSON.parse(content);
    return schema.parse(parsedContent);
}


async function callGoogleAI<T extends z.ZodType<any, any>>(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  schema: T
): Promise<z.infer<T>> {
    const genAI = new GoogleGenerativeAI(apiKey);
    const geminiModel = genAI.getGenerativeModel({ 
        model: model,
        systemInstruction: systemPrompt,
    });
    
    const result = await geminiModel.generateContent(userPrompt);
    const response = await result.response;
    const text = response.text();

    // Gemini doesn't have a native JSON mode like OpenAI, so we need to instruct it
    // and then parse the markdown-formatted JSON from the response.
    const jsonText = text.replace(/^```json\n/, '').replace(/\n```$/, '');

    const parsedContent = JSON.parse(jsonText);
    return schema.parse(parsedContent);
}
