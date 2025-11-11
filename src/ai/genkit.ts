import {genkit} from 'genkit';
import {openai} from 'genkit-plugin-openai';

// The API key is read from the OPENAI_API_KEY environment variable.
// This is a secure way to handle secrets and is configured in your project's settings.
const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.warn(
    'OpenAI API key is not configured. Please set the OPENAI_API_KEY environment variable in your project settings.'
  );
}

// Note: We are initializing Genkit without any plugins since we are calling OpenAI directly.
// This file is kept to maintain the project structure, but `ai` object is not used in the flows.
export const ai = genkit();
