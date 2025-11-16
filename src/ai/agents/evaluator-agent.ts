import { BaseAgent } from './base-agent';
import { gradeAnswer } from '../flows/grade-answer';
import type { GradeAnswerOutput } from '../flows/grade-answer';

/**
 * Agent responsible for evaluating open answers using an AI model.
 */
export class EvaluatorAgent extends BaseAgent {
    /**
     * Evaluates a user's answer against a correct answer.
     * @param question - The question text.
     * @param correctAnswer - The ideal correct answer.
     * @param userAnswer - The user's submitted answer.
     * @returns An object containing the grade ('correct', 'incorrect', 'partially_correct') and an explanation.
     */
    async run(question: string, correctAnswer: string, userAnswer: string): Promise<GradeAnswerOutput> {
        console.log(`[EvaluatorAgent] Evaluating answer with ${this.model.modelName} for question: "${question}"`);
        
        try {
            // Use the model passed to the agent during creation
            const modelName = this.model.modelName; 
            
            const result = await gradeAnswer({
                question,
                correctAnswer,
                userAnswer,
                model: modelName,
                // apiKey is handled by the unified-ai-handler now, so we pass null.
                apiKey: null, 
            });
            return result;
        } catch (error) {
            console.error('Error evaluating answer with EvaluatorAgent:', error);
            // Provide a fallback evaluation in case of AI error
            return {
                grade: 'incorrect',
                explanation: 'Sorry, I was unable to evaluate your answer at this time.'
            };
        }
    }
}
