import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

// IMPORTANT: Replace "YOUR_API_KEY_HERE" with your actual Gemini API key.
const apiKey = 'YOUR_API_KEY_HERE';

if (apiKey === 'YOUR_API_KEY_HERE') {
  console.warn(
    'Gemini API key is not configured. Please replace "YOUR_API_KEY_HERE" in src/ai/genkit.ts with your actual API key.'
  );
}

export const ai = genkit({
  plugins: [googleAI({apiKey})],
});
