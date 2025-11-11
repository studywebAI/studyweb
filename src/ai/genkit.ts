import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

// The API key is read from the GEMINI_API_KEY environment variable.
// This is a secure way to handle secrets and is configured in your project's settings.
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn(
    'Gemini API key is not configured. Please set the GEMINI_API_KEY environment variable in your project settings.'
  );
}

export const ai = genkit({
  plugins: [googleAI({apiKey})],
});
