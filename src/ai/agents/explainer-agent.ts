import { BaseAgent } from './base-agent';

/**
 * Agent responsible for generating explanations for answers.
 */
export class ExplainerAgent extends BaseAgent {
    /**
     * Generates an explanation for a given question and answer.
     * @param question - The question to explain.
     * @param isCorrect - Whether the user's answer was correct.
     * @param userAnswer - The user's answer.
     * @returns An explanation for the answer.
     */
    async run(question: any, isCorrect: boolean, userAnswer: any): Promise<string> {
        const prompt = `
            You are an expert tutor. A student has answered a quiz question.
            Your task is to provide a clear, concise, and helpful explanation.

            Question: "${question.question_text}"
            Correct Answer: ${JSON.stringify(question.correct_answer)}
            Student's Answer: ${JSON.stringify(userAnswer)}
            Was the student's answer correct? ${isCorrect}

            Based on this, provide an explanation.
            - If the student was correct, briefly reinforce why their answer is right.
            - If the student was incorrect, explain what the correct answer is and why, and clarify the misunderstanding.
            - Keep the tone encouraging and educational. Do not be condescending.
            - The explanation should be in plain text, not JSON.
        `;

        console.log(`[ExplainerAgent] Generating explanation with ${this.model.modelName} for question:`, question.question_text);
        
        try {
            const explanation = await this.model.generateContent(prompt);
            return explanation;
        } catch (error) {
            console.error('Error generating explanation from AI model:', error);
            return 'Sorry, I was unable to generate an explanation at this time.';
        }
    }
}
