import { OpenAI } from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Defines the structure for an AI model provider, specifying the client and model name.
export interface AIModel {
    client: any; 
    modelName: string;
}

// An object that holds various AI model configurations, mapping them by a provider and model key.
export const models: Record<string, Record<string, AIModel>> = {
    openai: {
        'gpt-4': {
            client: OpenAI,
            modelName: 'gpt-4'
        },
        'gpt-3.5-turbo': {
            client: OpenAI,
            modelName: 'gpt-3.5-turbo'
        }
    },
    google: {
        'gemini-pro': {
            client: GoogleGenerativeAI,
            modelName: 'gemini-pro'
        }
    }
};