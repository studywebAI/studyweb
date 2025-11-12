/**
 * @fileOverview This file provides a unified handler for making calls to different generative AI providers.
 * It abstracts the specific SDKs (OpenAI, Google GenAI) into a single function.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
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

export async function callGenerativeAI<T extends z.ZodType<any, any>>(
  params: CallGenerativeAIParams<T>
): Promise<z.infer<T>> {
  const { model, apiKey, systemPrompt, userPrompt, schema } = params;

  const provider = getProviderFromModel(model);

  let finalApiKey: string | undefined = apiKey?.key;

  if (provider === 'openai') {
    if (!finalApiKey) {
        finalApiKey = process.env.OPENAI_API_KEY;
    }
    if (!finalApiKey) {
        throw new Error('OpenAI API key is not configured. Please add it in the settings.');
    }
    return callOpenAI(finalApiKey, model, systemPrompt, userPrompt, schema);
  } else if (provider === 'google') {
     if (!finalApiKey) {
        finalApiKey = process.env.GEMINI_API_KEY;
    }
    if (!finalApiKey) {
        throw new Error('Gemini API key is not configured. Please add it in the settings.');
    }
    return callGoogleAI(finalApiKey, model, systemPrompt, userPrompt, schema);
  }

  throw new Error(`Unsupported model provider for model: ${model}`);
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