import { BaseAgent } from './base-agent';
import type { Question } from '@/types/database';

/**
 * Agent responsible for determining the difficulty of questions.
 * This is a heuristic-based implementation and can be replaced with an AI call.
 */
export class DifficultyAgent extends BaseAgent {
    /**
     * Calculates the difficulty of a question based on heuristics.
     * @param question - The question to analyze.
     * @returns A difficulty score between 0 and 10.
     */
    async run(question: Partial<Question>): Promise<number> {
        let score = 5; // Start with a baseline score

        // Adjust score based on question type
        switch (question.type) {
            case 'open_answer':
            case 'code_output':
            case 'whiteboard':
                score += 2;
                break;
            case 'multiple_choice':
                score += 1;
                break;
            case 'true_false':
                score -= 1;
                break;
            default:
                break;
        }

        // Adjust score based on question text length
        const textLength = question.question_text?.length || 0;
        if (textLength > 150) {
            score += 2;
        } else if (textLength > 75) {
            score += 1;
        }

        // Adjust score if there's an explanation (implies more depth)
        if (question.explanation) {
            score += 0.5;
        }

        // Clamp the score between 0 and 10
        const finalScore = Math.max(0, Math.min(10, score));
        
        console.log(`[DifficultyAgent] Calculated difficulty for question: "${question.question_text}". Score: ${finalScore}`);
        
        return Promise.resolve(Math.round(finalScore * 10) / 10);
    }
}
