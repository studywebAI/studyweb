'use server';

import { createAgent, AgentType, createGoogleModel } from '@/ai/agents/factory';
import type { GlobalModel, ApiKeys } from '@/components/app-provider';
import type { Question } from '@/types/database';

interface AIActionParams {
    model: GlobalModel;
    apiKey: { provider: keyof ApiKeys, key: string } | null;
}

function getAgent(agentType: AgentType, model: GlobalModel) {
    // For now, we'll use the Google model as the primary one.
    // The apiKey logic can be expanded later if needed.
    const generativeModel = createGoogleModel(model);
    return createAgent(agentType, generativeModel);
}

// --- Summary Tool Actions ---
interface GenerateSummaryParams extends AIActionParams {
    text: string;
}
export async function handleGenerateSummary({ text, model }: GenerateSummaryParams) {
    try {
        // The content agent can be repurposed for summarization for now.
        // A dedicated summarization agent/flow would be a future improvement.
        const summarizer = getAgent('content', model); 
        const prompt = `Summarize the following text concisely:\n\n${text}`;
        // This is a temporary solution; agents should have more specific methods.
        const summary = await summarizer.run(prompt, 1);
        return { summary: summary };
    } catch (error: any) {
        console.error(`[Action:handleGenerateSummary] ${error.message}`);
        throw new Error(`Failed to generate summary. ${error.message}`);
    }
}


// --- Quiz Tool Actions ---

interface GenerateQuizParams extends AIActionParams {
  summaryContent: string;
  options: {
    questionCount: number;
    difficulty: 'easy' | 'medium' | 'hard';
  };
}

export async function handleGenerateQuiz({ summaryContent, options, model }: GenerateQuizParams) {
    try {
        const contentAgent = getAgent('content', model);
        const generatedQuestions = await (contentAgent as any).run(summaryContent, options.questionCount);
        return { questions: generatedQuestions };
    } catch (error: any) {
        console.error(`[Action:handleGenerateQuiz] ${error.message}`);
        throw new Error(`Failed to generate quiz. ${error.message}`);
    }
}


interface GradeAnswerParams extends AIActionParams {
    question: string;
    correctAnswer: string;
    userAnswer: string;
}

export async function gradeAnswer({ question, correctAnswer, userAnswer, model }: GradeAnswerParams) {
    try {
        const evaluatorAgent = getAgent('evaluator', model);
        const result = await (evaluatorAgent as any).run(question, correctAnswer, userAnswer);
        return result;
    } catch (error: any) {
        console.error(`[Action:gradeAnswer] ${error.message}`);
        throw new Error(`Failed to grade answer. ${error.message}`);
    }
}


// --- Flashcards Tool Actions ---
interface GenerateFlashcardsParams extends AIActionParams {
    text: string;
}
export async function handleGenerateFlashcards({ text, model }: GenerateFlashcardsParams) {
     try {
        const contentAgent = getAgent('content', model);
        // We'll instruct the content agent to create flashcard-style content.
        const prompt = `Generate a list of flashcards from the following text. Each flashcard should have a 'front' (a question or term) and a 'back' (the answer or definition). Format the output as a JSON array like this: [{"front": "...", "back": "..."}]. Text: ${text}`;
        const result = await (contentAgent as any).run(prompt, 20); // Let's default to 20 cards.
        
        // This is a temporary workaround. The agent should return structured data.
        const cards = Array.isArray(result) ? result : JSON.parse(result);

        return { cards };
    } catch (error: any) {
        console.error(`[Action:handleGenerateFlashcards] ${error.message}`);
        throw new Error(`Failed to generate flashcards. ${error.message}`);
    }
}

interface GenerateHintParams extends AIActionParams {
  card: { front: string; back: string; };
}

export async function handleGenerateHint({ card, model }: GenerateHintParams) {
    try {
        const hintAgent = getAgent('hint', model);
        const hint = await (hintAgent as any).run({
            question_text: card.front,
            correct_answer: card.back
        });
        return { hint };
    } catch (error: any) {
        console.error(`[Action:handleGenerateHint] ${error.message}`);
        throw new Error(`Failed to generate hint. ${error.message}`);
    }
}


// --- Answer Tool Actions ---
interface GenerateAnswerParams extends AIActionParams {
    text: string;
    history: { role: 'user' | 'ai', content: string }[];
}

export async function handleGenerateAnswer({ text, history, model }: GenerateAnswerParams) {
    try {
        const explainerAgent = getAgent('explainer', model);
        // This agent is being repurposed for general Q&A.
        const result = await (explainerAgent as any).run({ question_text: text }, true, '');
        return { answer: result };
    } catch (error: any) {
        console.error(`[Action:handleGenerateAnswer] ${error.message}`);
        throw new Error(`Failed to generate answer. ${error.message}`);
    }
}
