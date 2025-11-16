import { BaseAgent } from './base-agent';

/**
 * Agent responsible for generating hints for questions.
 */
export class HintAgent extends BaseAgent {
    /**
     * Generates a hint for a given question.
     * @param question - The question to generate a hint for.
     * @returns A hint for the question.
     */
    async run(question: any): Promise<string> {
        const prompt = `
            You are a helpful study assistant. Your goal is to provide a single, subtle hint for the following quiz question to guide the student toward the correct answer without giving it away.

            Question: "${question.question_text}"
            
            Here are the possible answers (if any): ${JSON.stringify(question.answers)}
            
            The correct answer is: ${JSON.stringify(question.correct_answer)}

            Generate a short, one-sentence hint. The hint should not contain the correct answer or obvious parts of it. It should be a conceptual nudge.
        `;
        
        console.log(`[HintAgent] Generating hint with ${this.model.modelName} for question:`, question.question_text);
        
        try {
            const hint = await this.model.generateContent(prompt);
            return hint;
        } catch (error) {
            console.error('Error generating hint from AI model:', error);
            return 'Sorry, I was unable to generate a hint at this time.';
        }
    }
}
