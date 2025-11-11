'use client';
import {genkit} from 'genkit';

// Note: We are initializing Genkit without any plugins since we are calling OpenAI directly.
// The API key is read from the OPENAI_API_KEY environment variable in the flow files.
// This file is kept to maintain the project structure, but the `ai` object is not used in the flows.
export const ai = genkit();
