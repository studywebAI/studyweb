
'use server';
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google';

export const ai = genkit({
  plugins: [
    googleAI(),
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});
