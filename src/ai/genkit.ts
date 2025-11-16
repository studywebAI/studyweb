
'use server';
import {genkit, configureGenkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GEMINI_API_KEY,
    }),
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});

export interface AIModel {
    modelName: string;
    generateContent: (prompt: string) => Promise<any>;
}

export function createGoogleModel(modelName: string): AIModel {
    return {
        modelName,
        generateContent: async (prompt: string) => {
            const llmResponse = await ai.generate({
                model: `google/${modelName}`,
                prompt: prompt,
            });
            return llmResponse.text();
        }
    };
}

export const models: Record<string, Record<string, AIModel>> = {
    google: {
        'gemini-pro': createGoogleModel('gemini-pro'),
        'gemini-1.5-flash-latest': createGoogleModel('gemini-1.5-flash-latest')
    }
};
