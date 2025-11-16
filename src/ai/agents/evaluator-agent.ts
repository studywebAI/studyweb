import { BaseAgent } from './base-agent';

/**
 * Agent responsible for evaluating open answers.
 */
export class EvaluatorAgent extends BaseAgent {
    /**
     * Evaluates an open answer.
     * @param question - The question that was answered.
     * @param answer - The answer to evaluate.
     * @returns A boolean indicating whether the answer is correct.
     */
    async run(question: any, answer: string): Promise<boolean> {
        // In a real implementation, this would use the AI model to evaluate the answer.
        // For now, it returns a mock response.
        console.log(`Evaluating answer with ${this.model.modelName} for question:`, question, 'and answer:', answer);
        return Promise.resolve(true);
    }
}
