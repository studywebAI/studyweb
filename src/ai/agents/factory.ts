import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { BaseAgent } from './base-agent';
import { ContentAgent } from './content-agent';
import { DifficultyAgent } from './difficulty-agent';
import { HintAgent } from './hint-agent';
import { ExplainerAgent } from './explainer-agent';
import { TeacherAgent } from './teacher-agent';
import { EvaluatorAgent } from './evaluator-agent';
import { ai } from '@/ai/genkit';


// This is the new home for the model creation logic, outside of a 'use server' file.
export interface AIModel {
    modelName: string;
    generateContent: (prompt: string) => Promise<any>;
}

export class AgentFactory {
    static createAgent(type: string): BaseAgent {
        const model = ai.getmodel({ name: 'gemini-1.5-flash' });

        switch (type) {
            case 'content':
                return new ContentAgent(model);
            case 'difficulty':
                return new DifficultyAgent(model);
            case 'hint':
                return new HintAgent(model);
            case 'explainer':
                return new ExplainerAgent(model);
            case 'teacher':
                return new TeacherAgent(model);
            case 'evaluator':
                return new EvaluatorAgent(model);
            default:
                throw new Error(`Unknown agent type: ${type}`);
        }
    }
}
