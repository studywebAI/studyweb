import { nextHandler } from 'genkit/next';
import { ai } from '@/ai/genkit'; // Adjust this import path if needed


export const POST = nextHandler(ai);
