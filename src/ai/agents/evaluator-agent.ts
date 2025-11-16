
import { BaseAgent } from './base-agent';
import { z } from 'zod';

const GradeSchema = z.object({
    grade: z.enum(['correct', 'incorrect', 'partially_correct']).describe("The grade for the user's answer. 'partially_correct' can be used for answers that are close but not perfect."),
    explanation: z.string().describe("A brief explanation for why the answer was given this grade. If incorrect, explain why."),
});

type Grade = z.infer<typeof GradeSchema>;

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
    async run(question: string, correctAnswer: string, userAnswer: string): Promise<Grade> {
        
        const prompt = `
            You are an AI assistant that grades quiz answers.
            Evaluate the user's answer based on the provided question and the ideal correct answer.

            Your response must be a JSON object with two keys:
            1. "grade": A string which must be one of 'correct', 'incorrect', or 'partially_correct'.
               - Use 'correct' if the user's answer is essentially the same as the correct answer, allowing for very minor phrasing differences.
               - Use 'incorrect' if the user's answer is wrong.
               - Use 'partially_correct' if the user's answer is on the right track but is missing key information or has a minor error.
            2. "explanation": A concise explanation for the grade. If the answer is incorrect or partially correct, explain what's wrong or missing.

            Be strict but fair. Minor spelling errors should not necessarily make an answer incorrect if the meaning is clear.

            Here is the data to evaluate:
            Question: "${question}"
            Ideal Correct Answer: "${correctAnswer}"
            User's Answer: "${userAnswer}"

            Please grade the user's answer and respond only with the JSON object.
        `;
        
        console.log(`[EvaluatorAgent] Evaluating answer with ${this.model.modelName} for question: "${question}"`);
        
        try {
            const rawResponse = await this.model.generateContent(prompt);
            // The model should return a JSON string. We need to find it and parse it.
            const jsonString = rawResponse.match(/```json\n([\s\S]*?)\n```/)?.[1] || rawResponse;
            const parsed = JSON.parse(jsonString);
            const validation = GradeSchema.safeParse(parsed);

            if (validation.success) {
                return validation.data;
            } else {
                 console.error('AI response validation failed:', validation.error);
                 throw new Error('AI returned data in an invalid format.');
            }

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
