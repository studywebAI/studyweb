import { generateQuestions } from '../flows/generate-questions';
import { BaseAgent } from './base-agent';
import { models } from '../genkit'; // Note: This import is illustrative. The actual model would be passed in.

/**
 * Agent responsible for generating quiz content.
 * This agent is a wrapper around the `generateQuestions` flow.
 */
export class ContentAgent extends BaseAgent {
    /**
     * Generates quiz questions based on a given topic and count.
     * @param topic - The topic to generate questions about.
     * @param questionCount - The number of questions to generate.
     * @returns A promise that resolves to the generated questions.
     */
    async run(topic: string, questionCount: number): Promise<any> {
        console.log(`[ContentAgent] Generating ${questionCount} questions for topic: "${topic}" using ${this.model.modelName}`);
        
        try {
            const result = await generateQuestions({ topic, questionCount });
            return result.questions;
        } catch (error) {
            console.error('Error generating content with ContentAgent:', error);
            throw new Error('Failed to generate quiz content.');
        }
    }
}
