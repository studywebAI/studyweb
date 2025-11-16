'use server';

import { createAgent } from '@/ai/agents/factory';
import { models } from '@/ai/models';

// Placeholder for fetching a question from the database
// In a real implementation, this would fetch from Supabase
async function getQuestionById(id: string) {
    return {
        id,
        question_text: 'What is the capital of France?',
        type: 'multiple_choice',
        answers: { a: 'Paris', b: 'London', c: 'Berlin', d: 'Madrid' },
        correct_answer: 'a'
    };
}

/**
 * Generates a hint for a given question.
 * @param question - The question to get a hint for.
 * @returns The generated hint.
 */
export async function getHint(question: any) {
    try {
        const hintAgent = createAgent('hint', models.google['gemini-pro']);
        const hint = await hintAgent.run(question);
        return { success: true, content: hint };
    } catch (error) {
        console.error(error);
        return { success: false, content: 'Failed to generate hint.' };
    }
}

/**
 * Generates an explanation for a given question.
 * @param question - The question to get an explanation for.
 * @returns The generated explanation.
 */
export async function getExplanation(question: any) {
    try {
        const explainerAgent = createAgent('explainer', models.google['gemini-pro']);
        const explanation = await explainerAgent.run(question, question.correct_answer);
        return { success: true, content: explanation };
    } catch (error) {
        console.error(error);
        return { success: false, content: 'Failed to generate explanation.' };
    }
}

/**
 * Evaluates a user's answer for a given question.
 * @param questionId - The ID of the question.
 * @param answer - The user's answer.
 * @returns An object containing whether the answer was correct and the correct answer.
 */
export async function evaluateAnswer(questionId: string, answer: any) {
    try {
        const question = await getQuestionById(questionId);
        let is_correct = false;

        switch (question.type) {
            case 'multiple_choice':
                is_correct = question.correct_answer === answer.key;
                break;
            case 'true_false':
                is_correct = question.correct_answer === answer.is_true;
                break;
            case 'open_answer':
                const evaluatorAgent = createAgent('evaluator', models.google['gemini-pro']);
                is_correct = await evaluatorAgent.run(question, answer.text);
                break;
            // Add cases for other question types here
            default:
                is_correct = false;
        }

        return { is_correct, correct_answer: question.correct_answer };
    } catch (error) {
        console.error(error);
        return { is_correct: false, correct_answer: null };
    }
}
