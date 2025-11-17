import { nextHandler } from '@genkit-ai/next/plugin';
import { ai } from '@/ai/genkit'; // Adjust this import path if needed


export const POST = nextHandler(ai);
