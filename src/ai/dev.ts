import { config } from 'dotenv';
config();

import '@/ai/flows/import-content-for-quiz-generation.ts';
import '@/ai/flows/generate-flashcards-from-text.ts';
import '@/ai/flows/generate-summary-from-text.ts';
import '@/ai/flows/search-and-import-summary.ts';
import '@/ai/flows/generate-quiz-from-summary.ts';